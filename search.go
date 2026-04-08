package main

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// SearchNode represents a node in the query AST
type SearchNode interface {
	Match(fields []string) bool
}

// LiteralNode represents a simple substring match
type LiteralNode struct {
	text string
}

func (n *LiteralNode) Match(fields []string) bool {
	for _, field := range fields {
		if strings.Contains(field, n.text) {
			return true
		}
	}
	return false
}

// RegexNode represents a regular expression match
type RegexNode struct {
	regex *regexp.Regexp
}

func (n *RegexNode) Match(fields []string) bool {
	for _, field := range fields {
		if n.regex.MatchString(field) {
			return true
		}
	}
	return false
}

// PhraseNode represents an exact phrase match
type PhraseNode struct {
	phrase string
}

func (n *PhraseNode) Match(fields []string) bool {
	for _, field := range fields {
		if strings.Contains(field, n.phrase) {
			return true
		}
	}
	return false
}

// AndNode represents a conjunction of multiple conditions
type AndNode struct {
	left  SearchNode
	right SearchNode
}

func (n *AndNode) Match(fields []string) bool {
	return n.left.Match(fields) && n.right.Match(fields)
}

// OrNode represents a disjunction of multiple conditions
type OrNode struct {
	left  SearchNode
	right SearchNode
}

func (n *OrNode) Match(fields []string) bool {
	return n.left.Match(fields) || n.right.Match(fields)
}

// NotNode represents the negation of a condition
type NotNode struct {
	child SearchNode
}

func (n *NotNode) Match(fields []string) bool {
	return !n.child.Match(fields)
}

type TokenType int

const (
	TokenLiteral TokenType = iota
	TokenRegex
	TokenPhrase
	TokenAnd
	TokenOr
	TokenNot
	TokenLParen
	TokenRParen
	TokenEOF
)

type Token struct {
	Type  TokenType
	Value string
}

func hasSpecialSyntax(raw string) bool {
	if strings.ContainsAny(raw, `"/()`) {
		return true
	}
	tokens := strings.Fields(raw)
	for _, t := range tokens {
		if t == "AND" || t == "OR" || t == "NOT" || t == "+" || t == "-" {
			return true
		}
		if strings.HasPrefix(t, "-") && len(t) > 1 {
			return true
		}
	}
	return false
}

func tokenize(input string) ([]Token, error) {
	var tokens []Token
	i := 0
	n := len(input)

	for i < n {
		c := rune(input[i])
		if unicode.IsSpace(c) {
			i++
			continue
		}

		switch {
		case c == '(':
			tokens = append(tokens, Token{Type: TokenLParen, Value: "("})
			i++
		case c == ')':
			tokens = append(tokens, Token{Type: TokenRParen, Value: ")"})
			i++
		case c == '+':
			tokens = append(tokens, Token{Type: TokenAnd, Value: "+"})
			i++
		case c == '-':
			tokens = append(tokens, Token{Type: TokenNot, Value: "-"})
			i++
		case c == '"':
			start := i + 1
			end := start
			for end < n && input[end] != '"' {
				end++
			}
			if end >= n {
				return nil, errors.New("unclosed phrase quote")
			}
			tokens = append(tokens, Token{Type: TokenPhrase, Value: input[start:end]})
			i = end + 1
		case c == '/':
			start := i + 1
			end := start
			for end < n && input[end] != '/' {
				if input[end] == '\\' && end+1 < n {
					end += 2
				} else {
					end++
				}
			}
			if end >= n {
				return nil, errors.New("unclosed regex slash")
			}
			val := input[start:end]
			if len(val) > 500 {
				return nil, errors.New("regex pattern too long (max 500 chars)")
			}
			tokens = append(tokens, Token{Type: TokenRegex, Value: val})
			i = end + 1
		default:
			start := i
			for i < n {
				ch := rune(input[i])
				if unicode.IsSpace(ch) || strings.ContainsRune("()+\"-/", ch) {
					break
				}
				i++
			}
			word := input[start:i]
			if word != "" {
				switch word {
				case "AND":
					tokens = append(tokens, Token{Type: TokenAnd, Value: "AND"})
				case "OR":
					tokens = append(tokens, Token{Type: TokenOr, Value: "OR"})
				case "NOT":
					tokens = append(tokens, Token{Type: TokenNot, Value: "NOT"})
				default:
					tokens = append(tokens, Token{Type: TokenLiteral, Value: word})
				}
			}
		}
	}
	tokens = append(tokens, Token{Type: TokenEOF})
	return tokens, nil
}

type parser struct {
	tokens []Token
	pos    int
}

func (p *parser) peek() Token {
	if p.pos < len(p.tokens) {
		return p.tokens[p.pos]
	}
	return Token{Type: TokenEOF}
}

func (p *parser) next() Token {
	tok := p.peek()
	if p.pos < len(p.tokens) {
		p.pos++
	}
	return tok
}

func (p *parser) match(t TokenType) bool {
	if p.peek().Type == t {
		p.next()
		return true
	}
	return false
}

func (p *parser) parseOr() (SearchNode, error) {
	left, err := p.parseAnd()
	if err != nil {
		return nil, err
	}

	for p.match(TokenOr) {
		right, err := p.parseAnd()
		if err != nil {
			return nil, err
		}
		left = &OrNode{left: left, right: right}
	}
	return left, nil
}

func (p *parser) parseAnd() (SearchNode, error) {
	left, err := p.parseNot()
	if err != nil {
		return nil, err
	}

	for {
		if p.match(TokenAnd) {
			right, err := p.parseNot()
			if err != nil {
				return nil, err
			}
			left = &AndNode{left: left, right: right}
		} else {
			tok := p.peek()
			if tok.Type == TokenLiteral || tok.Type == TokenPhrase || tok.Type == TokenRegex || tok.Type == TokenLParen || tok.Type == TokenNot {
				right, err := p.parseNot()
				if err != nil {
					return nil, err
				}
				left = &AndNode{left: left, right: right}
			} else {
				break
			}
		}
	}
	return left, nil
}

func (p *parser) parseNot() (SearchNode, error) {
	if p.match(TokenNot) {
		child, err := p.parseNot() // recursive to handle NOT NOT
		if err != nil {
			return nil, err
		}
		return &NotNode{child: child}, nil
	}
	return p.parsePrimary()
}

func (p *parser) parsePrimary() (SearchNode, error) {
	tok := p.next()

	switch tok.Type {
	case TokenLParen:
		node, err := p.parseOr()
		if err != nil {
			return nil, err
		}
		if !p.match(TokenRParen) {
			return nil, errors.New("missing closing parenthesis")
		}
		return node, nil
	case TokenLiteral:
		return &LiteralNode{text: strings.ToLower(tok.Value)}, nil
	case TokenPhrase:
		return &PhraseNode{phrase: strings.ToLower(tok.Value)}, nil
	case TokenRegex:
		re, err := regexp.Compile(tok.Value)
		if err != nil {
			return nil, fmt.Errorf("invalid regex: %w", err)
		}
		return &RegexNode{regex: re}, nil
	case TokenEOF:
		return nil, errors.New("unexpected end of query")
	default:
		return nil, fmt.Errorf("unexpected token: %v", tok.Value)
	}
}

func ParseSearchQuery(raw string) (SearchNode, error) {
	rawTrimmed := strings.TrimSpace(raw)
	if rawTrimmed == "" {
		return &LiteralNode{text: ""}, nil
	}

	if !hasSpecialSyntax(rawTrimmed) {
		return &LiteralNode{text: strings.ToLower(rawTrimmed)}, nil
	}

	tokens, err := tokenize(rawTrimmed)
	if err != nil {
		return nil, err
	}

	p := &parser{tokens: tokens, pos: 0}
	node, err := p.parseOr()
	if err != nil {
		return nil, err
	}

	if p.peek().Type != TokenEOF {
		return nil, errors.New("unexpected trailing characters in query")
	}

	return node, nil
}
