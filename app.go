package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	parquet "github.com/parquet-go/parquet-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

// Entry mirrors one row in the Parquet file.
type Entry struct {
	ImagePath   string `parquet:"image_path" json:"image_path"`
	Prompt      string `parquet:"prompt" json:"prompt"`
	Description string `parquet:"description" json:"description"`
	CreatedAt   string `parquet:"created_at" json:"created_at"`   // RFC3339 or "" if null
	ModifiedAt  string `parquet:"modified_at" json:"modified_at"` // RFC3339 or "" if null
}

// ImageMeta is returned by GetImageMeta.
type ImageMeta struct {
	Width       int     `json:"width"`
	Height      int     `json:"height"`
	FileSizeKB  float64 `json:"file_size_kb"`
	AspectRatio string  `json:"aspect_ratio"`
	Megapixels  float64 `json:"megapixels"`
	Exists      bool    `json:"exists"`
}

// DBStats is returned by GetStats.
type DBStats struct {
	TotalEntries  int    `json:"total_entries"`
	ImagesFound   int    `json:"images_found"`
	ImagesMissing int    `json:"images_missing"`
	UniquePrompts int    `json:"unique_prompts"`
	OldestDate    string `json:"oldest_date"`
	NewestDate    string `json:"newest_date"`
	FileSizeStr   string `json:"file_size_str"`
}

// FilterParams holds all sidebar filter / sort / search state.
type FilterParams struct {
	ExistenceFilter string   `json:"existence_filter"` // "all" | "found" | "missing"
	SelectedSubdirs []string `json:"selected_subdirs"`
	SubdirQuery     string   `json:"subdir_query"`
	SelectedPrompts []string `json:"selected_prompts"` // empty = all
	SortOption      string   `json:"sort_option"`
	SearchQuery     string   `json:"search_query"`
	SearchIn        string   `json:"search_in"` // "filename_or_prompt" | "prompt" | "filename" | "full_path" | "all"
	Page            int      `json:"page"`
	ItemsPerPage    int      `json:"items_per_page"`
}

// PageResult is the response to GetPage.
type PageResult struct {
	Entries     []Entry  `json:"entries"`
	TotalItems  int      `json:"total_items"`
	TotalPages  int      `json:"total_pages"`
	CurrentPage int      `json:"current_page"`
	AllSubdirs  []string `json:"all_subdirs"`
	AllPrompts  []string `json:"all_prompts"`
}

type App struct {
	ctx     context.Context
	dbPath  string
	entries []Entry
	mu      sync.RWMutex
}

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Parse --database flag from os.Args
	for i, arg := range os.Args {
		if (arg == "--database" || arg == "--db") && i+1 < len(os.Args) {
			_ = a.LoadDatabase(os.Args[i+1])
			break
		}
	}
}

func (a *App) LoadDatabase(path string) string {
	a.mu.Lock()
	defer a.mu.Unlock()

	f, err := os.Open(path)
	if err != nil {
		return err.Error()
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil {
		return err.Error()
	}

	pf, err := parquet.OpenFile(f, info.Size())
	if err != nil {
		return err.Error()
	}

	var newEntries []Entry

	// read row by row using high-level schema
	for _, rg := range pf.RowGroups() {
		rows := rg.Rows()
		for {
			rowBuf := make([]parquet.Row, 1)
			n, err := rows.ReadRows(rowBuf)
			if err != nil && n == 0 {
				break
			}
			
			var entry Entry
			schema := pf.Schema()
			for _, val := range rowBuf[0] {
				if val.IsNull() {
					continue
				}
				colName := schema.Fields()[val.Column()].Name()
				v := val.String()
				switch colName {
				case "image_path":
					entry.ImagePath = string(v)
				case "prompt":
					entry.Prompt = string(v)
				case "description":
					entry.Description = string(v)
				case "created_at":
					entry.CreatedAt = string(v)
				case "modified_at":
					entry.ModifiedAt = string(v)
				}
			}
			newEntries = append(newEntries, entry)
		}
		rows.Close()
	}

	a.entries = newEntries
	a.dbPath = path
	return ""
}

func (a *App) OpenFilePicker() string {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Parquet Database",
		Filters: []runtime.FileFilter{
			{DisplayName: "Parquet Files", Pattern: "*.parquet"},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
	if err != nil {
		return ""
	}
	return path
}

func (a *App) GetStats() DBStats {
	a.mu.RLock()
	defer a.mu.RUnlock()

	stats := DBStats{
		TotalEntries: len(a.entries),
	}

	prompts := make(map[string]bool)
	var minTime, maxTime time.Time
	firstTime := true

	for _, e := range a.entries {
		if _, err := os.Stat(e.ImagePath); err == nil {
			stats.ImagesFound++
		} else {
			stats.ImagesMissing++
		}

		if e.Prompt != "" {
			prompts[e.Prompt] = true
		}

		if e.CreatedAt != "" && e.CreatedAt != "<null>" {
			t := parseTimeSafe(e.CreatedAt)
			if !t.IsZero() {
				if firstTime {
					minTime, maxTime = t, t
					firstTime = false
				} else {
					if t.Before(minTime) {
						minTime = t
					}
					if t.After(maxTime) {
						maxTime = t
					}
				}
			}
		}
	}
	stats.UniquePrompts = len(prompts)
	if !firstTime {
		stats.OldestDate = minTime.Format("2006-01-02")
		stats.NewestDate = maxTime.Format("2006-01-02")
	}

	if a.dbPath != "" {
		if info, err := os.Stat(a.dbPath); err == nil {
			stats.FileSizeStr = fmt.Sprintf("%.2f MB", float64(info.Size())/1024/1024)
		}
	}

	return stats
}

func (a *App) GetAllSubdirs() []string {
	a.mu.RLock()
	defer a.mu.RUnlock()

	dirMap := make(map[string]bool)
	for _, e := range a.entries {
		dir := filepath.Dir(e.ImagePath)
		if dir != "." && dir != "/" {
			dirMap[dir] = true
		}
	}
	var dirs []string
	for d := range dirMap {
		dirs = append(dirs, d)
	}
	sort.Slice(dirs, func(i, j int) bool {
		return dirs[i] > dirs[j] // reverse alpha
	})
	return dirs
}

func (a *App) GetAllPrompts() []string {
	a.mu.RLock()
	defer a.mu.RUnlock()

	pMap := make(map[string]bool)
	for _, e := range a.entries {
		pMap[e.Prompt] = true
	}
	var ps []string
	for p := range pMap {
		ps = append(ps, p)
	}
	sort.Strings(ps)
	return ps
}

func parseTimeSafe(s string) time.Time {
	if s == "" || s == "<null>" {
		return time.Time{}
	}
	t, err := time.Parse(time.RFC3339, s)
	if err == nil {
		return t
	}
	// try unix nanos
	if nanos, err := strconv.ParseInt(s, 10, 64); err == nil {
		return time.Unix(0, nanos)
	}
	return time.Time{}
}

func (a *App) GetPage(params FilterParams) PageResult {
	a.mu.RLock()
	defer a.mu.RUnlock()

	var filtered []Entry

	// Subdir map for quick lookup
	selSubdirs := make(map[string]bool)
	for _, d := range params.SelectedSubdirs {
		selSubdirs[d] = true
	}
	selPrompts := make(map[string]bool)
	for _, p := range params.SelectedPrompts {
		selPrompts[p] = true
	}

	sq := strings.ToLower(params.SearchQuery)
	subq := strings.ToLower(params.SubdirQuery)

	for _, e := range a.entries {
		// 1. Existence filter
		if params.ExistenceFilter == "found" || params.ExistenceFilter == "missing" {
			_, err := os.Stat(e.ImagePath)
			exists := err == nil
			if params.ExistenceFilter == "found" && !exists {
				continue
			}
			if params.ExistenceFilter == "missing" && exists {
				continue
			}
		}

		// 2. Subdirectory filter
		dir := filepath.ToSlash(filepath.Dir(e.ImagePath))
		if len(params.SelectedSubdirs) > 0 {
			matched := false
			for d := range selSubdirs {
				if strings.Contains(dir, d) {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}
		if subq != "" {
			if !strings.Contains(strings.ToLower(dir), subq) {
				continue
			}
		}

		// 3. Prompt filter
		if len(params.SelectedPrompts) > 0 {
			if !selPrompts[e.Prompt] {
				continue
			}
		}

		// 5. Search
		if sq != "" {
			desc := strings.ToLower(e.Description)
			fname := strings.ToLower(filepath.Base(e.ImagePath))
			fpath := strings.ToLower(filepath.ToSlash(e.ImagePath))
			prompt := strings.ToLower(e.Prompt)

			switch params.SearchIn {
			case "filename_or_prompt":
				if !strings.Contains(fname, sq) && !strings.Contains(desc, sq) && !strings.Contains(prompt, sq) {
					continue
				}
			case "prompt":
				if !strings.Contains(desc, sq) {
					continue
				}
			case "filename":
				if !strings.Contains(fname, sq) {
					continue
				}
			case "full_path":
				if !strings.Contains(fpath, sq) {
					continue
				}
			case "all":
				if !strings.Contains(desc, sq) && !strings.Contains(fpath, sq) {
					continue
				}
			}
		}

		filtered = append(filtered, e)
	}

	// 4. Sort
	sort.Slice(filtered, func(i, j int) bool {
		switch params.SortOption {
		case "name_asc":
			return filtered[i].ImagePath < filtered[j].ImagePath
		case "name_desc":
			return filtered[i].ImagePath > filtered[j].ImagePath
		case "prompt_asc":
			return filtered[i].Description < filtered[j].Description
		case "prompt_desc":
			return filtered[i].Description > filtered[j].Description
		case "created_asc":
			t1 := parseTimeSafe(filtered[i].CreatedAt)
			t2 := parseTimeSafe(filtered[j].CreatedAt)
			if t1.IsZero() { return false }
			if t2.IsZero() { return true }
			return t1.Before(t2)
		case "created_desc":
			t1 := parseTimeSafe(filtered[i].CreatedAt)
			t2 := parseTimeSafe(filtered[j].CreatedAt)
			if t1.IsZero() { return false }
			if t2.IsZero() { return true }
			return t1.After(t2)
		case "modified_asc":
			t1 := parseTimeSafe(filtered[i].ModifiedAt)
			t2 := parseTimeSafe(filtered[j].ModifiedAt)
			if t1.IsZero() { return false }
			if t2.IsZero() { return true }
			return t1.Before(t2)
		case "modified_desc":
			t1 := parseTimeSafe(filtered[i].ModifiedAt)
			t2 := parseTimeSafe(filtered[j].ModifiedAt)
			if t1.IsZero() { return false }
			if t2.IsZero() { return true }
			return t1.After(t2)
		default:
			return false
		}
	})

	// 6. Paginate
	totalItems := len(filtered)
	itemsPerPage := params.ItemsPerPage
	if itemsPerPage <= 0 {
		itemsPerPage = 10
	}
	totalPages := (totalItems + itemsPerPage - 1) / itemsPerPage
	
	page := params.Page
	if page < 1 {
		page = 1
	}
	if page > totalPages {
		page = totalPages
	}

	var paged []Entry
	if totalItems > 0 {
		start := (page - 1) * itemsPerPage
		end := start + itemsPerPage
		if end > totalItems {
			end = totalItems
		}
		paged = filtered[start:end]
	}

	allDirsMap := make(map[string]bool)
	allPromptsMap := make(map[string]bool)
	for _, e := range filtered {
		allDirsMap[filepath.ToSlash(filepath.Dir(e.ImagePath))] = true
		allPromptsMap[e.Prompt] = true
	}
	var allDirs []string
	for d := range allDirsMap {
		allDirs = append(allDirs, d)
	}
	sort.Strings(allDirs)

	var allPrompts []string
	for p := range allPromptsMap {
		allPrompts = append(allPrompts, p)
	}
	sort.Strings(allPrompts)

	if paged == nil {
		paged = []Entry{}
	}

	return PageResult{
		Entries:     paged,
		TotalItems:  totalItems,
		TotalPages:  totalPages,
		CurrentPage: page,
		AllSubdirs:  allDirs,
		AllPrompts:  allPrompts,
	}
}

func computeAspectRatio(w, h int) string {
	if w <= 0 || h <= 0 {
		return "N/A"
	}
	actual := float64(w) / float64(h)

	famous := []struct {
		name  string
		ratio float64
	}{
		{"1:1", 1.0},
		{"4:3", 4.0 / 3}, {"3:4", 3.0 / 4},
		{"3:2", 1.5}, {"2:3", 2.0 / 3},
		{"16:9", 16.0 / 9}, {"9:16", 9.0 / 16},
		{"21:9", 21.0 / 9}, {"9:21", 9.0 / 21},
		{"5:4", 1.25}, {"4:5", 0.8},
		{"9:7", 9.0 / 7}, {"7:9", 7.0 / 9},
		{"16:10", 1.6}, {"10:16", 10.0 / 16},
		{"7:5", 1.4}, {"5:7", 5.0 / 7},
	}
	for _, f := range famous {
		if math.Abs(actual-f.ratio)/f.ratio < 0.02 {
			return f.name
		}
	}

	best := "N/A"
	minErr := math.Inf(1)
	for x := 1; x <= 16; x++ {
		for y := 1; y <= 16; y++ {
			r := float64(x) / float64(y)
			if e := math.Abs(actual - r); e < minErr {
				minErr = e
				best = fmt.Sprintf("%d:%d", x, y)
			}
		}
	}
	return best
}

func (a *App) GetImageMeta(imagePath string) ImageMeta {
	info, err := os.Stat(imagePath)
	if err != nil {
		return ImageMeta{Exists: false}
	}
	
	f, err := os.Open(imagePath)
	if err != nil {
		return ImageMeta{Exists: true, FileSizeKB: float64(info.Size()) / 1024.0}
	}
	defer f.Close()

	cfg, _, err := image.DecodeConfig(f)
	if err != nil {
		return ImageMeta{Exists: true, FileSizeKB: float64(info.Size()) / 1024.0}
	}

	mp := float64(cfg.Width*cfg.Height) / 1000000.0

	return ImageMeta{
		Width:       cfg.Width,
		Height:      cfg.Height,
		FileSizeKB:  float64(info.Size()) / 1024.0,
		AspectRatio: computeAspectRatio(cfg.Width, cfg.Height),
		Megapixels:  mp,
		Exists:      true,
	}
}

func (a *App) GetThumbnail(imagePath string, maxSize int) string {
	f, err := os.Open(imagePath)
	if err != nil {
		return ""
	}
	defer f.Close()

	img, _, err := image.Decode(f)
	if err != nil {
		return ""
	}

	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	if w > maxSize || h > maxSize {
		var nw, nh int
		if w > h {
			nw = maxSize
			nh = int(float64(h) * float64(maxSize) / float64(w))
		} else {
			nh = maxSize
			nw = int(float64(w) * float64(maxSize) / float64(h))
		}
		
		dst := image.NewRGBA(image.Rect(0, 0, nw, nh))
		draw.NearestNeighbor.Scale(dst, dst.Rect, img, bounds, draw.Over, nil)
		img = dst
	}

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85}); err != nil {
		return ""
	}

	return "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())
}

func (a *App) SaveDescription(imagePath string, description string) string {
	a.mu.Lock()
	defer a.mu.Unlock()

	for i, e := range a.entries {
		if e.ImagePath == imagePath {
			a.entries[i].Description = description
			a.entries[i].ModifiedAt = time.Now().UTC().Format(time.RFC3339)
			break
		}
	}

	tmp := a.dbPath + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		return err.Error()
	}

	w := parquet.NewGenericWriter[Entry](f)
	_, err = w.Write(a.entries)
	if err != nil {
		f.Close()
		os.Remove(tmp)
		return err.Error()
	}
	if err = w.Close(); err != nil {
		f.Close()
		os.Remove(tmp)
		return err.Error()
	}
	f.Close()
	err = os.Rename(tmp, a.dbPath)
	if err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) SaveTextFile(filename string, content string) string {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: filename,
		Filters: []runtime.FileFilter{
			{DisplayName: "Text Files", Pattern: "*.txt"},
		},
	})
	if err != nil || path == "" {
		return ""
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return err.Error()
	}
	return ""
}
