# Makefile for goParquet

# Detect host OS and Architecture
OS := $(shell go env GOOS)
ARCH := $(shell go env GOARCH)
PLATFORM := $(OS)/$(ARCH)

.PHONY: build clean

# Default target builds for the local host platform only
build: frontend
	@echo "Detected host: $(PLATFORM)"
	@echo "Building for $(PLATFORM)..."
	@if [ "$(OS)" = "linux" ]; then \
		wails build -platform $(PLATFORM) -clean -tags webkit2_41; \
	else \
		wails build -platform $(PLATFORM) -clean; \
	fi

# Rebuild the frontend
frontend:
	@echo "Building frontend..."
	cd frontend && npm install && npm run build

# Clean the build output directory
clean:
	@echo "Cleaning build directory..."
	rm -rf build/bin/*
