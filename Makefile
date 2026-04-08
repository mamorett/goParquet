# Makefile for goParquet

# Detect host OS and Architecture
OS := $(shell go env GOOS)
ARCH := $(shell go env GOARCH)
DEFAULT_PLATFORM := $(OS)/$(ARCH)

# Allow overriding platform/tags from environment
PLATFORM ?= $(DEFAULT_PLATFORM)
TAGS ?=

.PHONY: build clean sync-assets frontend

# Default target builds for the local host platform only
build: frontend
	@echo "Detected platform: $(PLATFORM)"
	@echo "Building for $(PLATFORM)..."
	@if [ "$(OS)" = "linux" ] || [ "$(findstring linux,$(PLATFORM))" != "" ]; then \
		wails build -platform $(PLATFORM) -clean -tags webkit2_41 $(TAGS); \
	else \
		wails build -platform $(PLATFORM) -clean $(TAGS); \
	fi

# Sync assets like icons from build source to frontend
sync-assets:
	@echo "Syncing assets to frontend..."
	mkdir -p frontend/public
	cp build/appicon.png frontend/public/logo.png

# Rebuild the frontend
frontend: sync-assets
	@echo "Building frontend..."
	cd frontend && npm install && npm run build

# Linux User-Local Installation (No sudo required)
user-install: build
	@if [ "$(OS)" = "linux" ]; then \
		echo "Installing goParquet to $(HOME)/.local/bin..."; \
		mkdir -p $(HOME)/.local/bin; \
		cp build/bin/goParquet $(HOME)/.local/bin/goParquet; \
		echo "Installing icon..."; \
		mkdir -p $(HOME)/.local/share/icons/hicolor/512x512/apps; \
		cp build/appicon.png $(HOME)/.local/share/icons/hicolor/512x512/apps/go-parquet.png; \
		echo "Installing .desktop file..."; \
		mkdir -p $(HOME)/.local/share/applications; \
		sed -e "s|Exec=goParquet|Exec=$(HOME)/.local/bin/goParquet|" \
		    -e "s|Icon=go-parquet|Icon=$(HOME)/.local/share/icons/hicolor/512x512/apps/go-parquet.png|" \
		    build/linux/go-parquet.desktop > $(HOME)/.local/share/applications/goParquet.desktop; \
		chmod +x $(HOME)/.local/share/applications/goParquet.desktop; \
		update-desktop-database $(HOME)/.local/share/applications; \
		echo "Installation complete! You may need to restart your dock or logout for changes to take effect."; \
	else \
		echo "User-install target currently only supports Linux."; \
	fi
