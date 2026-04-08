package main

import (
	"testing"
)

func TestParseSearchQuery(t *testing.T) {
	tests := []struct {
		name    string
		query   string
		wantErr bool
	}{
		{"simple literal", "cat", false},
		{"AND with plus", "cat + dog", false},
		{"AND with keyword", "cat AND dog", false},
		{"implicit AND", "cat dog", false},
		{"OR", "cat OR dog", false},
		{"NOT keyword", "NOT cat", false},
		{"NOT minus", "-cat", false},
		{"regex", "/cat\\d+/", false},
		{"phrase", "\"black cat\"", false},
		{"grouping", "(cat OR dog) AND fish", false},
		{"mixed precedence", "cat + dog OR fish", false},
		{"implicit AND with grouping", "(cat OR dog) fish", false},
		{"multiple NOTs", "NOT NOT cat", false},
		{"complex query", "(/cat\\d+/ OR \"black cat\") + -fish", false},
		{"invalid regex", "/[/", true},
		{"mismatched parens", "(cat OR dog", true},
		{"backward compatibility", "hello world", false},
		{"operator at end", "cat AND", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			node, err := ParseSearchQuery(tt.query)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseSearchQuery() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && node == nil {
				t.Errorf("ParseSearchQuery() returned nil node for valid query")
			}
		})
	}
}

func TestSearchNodeMatch(t *testing.T) {
	tests := []struct {
		name   string
		query  string
		fields []string
		want   bool
	}{
		{"literal match", "cat", []string{"black cat is here", "dog"}, true},
		{"literal mismatch", "cat", []string{"black dog is here", "fish"}, false},
		{"phrase match", "\"black cat\"", []string{"a black cat", "dog"}, true},
		{"phrase mismatch", "\"black cat\"", []string{"black dog", "cat"}, false},
		{"regex match", "/cat\\d+/", []string{"cat123 is here"}, true},
		{"regex mismatch", "/cat\\d+/", []string{"cat is here"}, false},
		{"AND match", "cat + dog", []string{"cat and dog"}, true},
		{"AND mismatch", "cat AND dog", []string{"cat and fish"}, false},
		{"OR match", "cat OR dog", []string{"fish and dog"}, true},
		{"OR mismatch", "cat OR dog", []string{"fish and bird"}, false},
		{"NOT match", "-cat", []string{"dog and fish"}, true},
		{"NOT mismatch", "NOT cat", []string{"cat and fish"}, false},
		{"grouping match", "(cat OR dog) AND fish", []string{"dog and fish"}, true},
		{"grouping mismatch", "(cat OR dog) AND fish", []string{"dog and bird"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			node, err := ParseSearchQuery(tt.query)
			if err != nil {
				t.Fatalf("Failed to parse query: %v", err)
			}
			if got := node.Match(tt.fields); got != tt.want {
				t.Errorf("Match() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestHasSpecialSyntax(t *testing.T) {
	tests := []struct {
		query string
		want  bool
	}{
		{"hello world", false},
		{"hello+world", false}, // + not at word boundary
		{"hello-world", false}, // - not at word boundary
		{"hello AND world", true},
		{"hello OR world", true},
		{"NOT hello", true},
		{"hello + world", true},
		{"-hello", true},
		{"\"hello\"", true},
		{"/hello/", true},
		{"(hello)", true},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			if got := hasSpecialSyntax(tt.query); got != tt.want {
				t.Errorf("hasSpecialSyntax(%q) = %v, want %v", tt.query, got, tt.want)
			}
		})
	}
}
