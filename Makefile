# Makefile for goParquet Wails application

# To build for macOS from Linux, you may need a cross-compiler like osxcross installed.
# Make sure the 'wails' CLI is available in your PATH.

.PHONY: all linux-amd64 linux-arm64 macos-arm64 build-all clean

# Build all requested platforms sequentially
all: linux-amd64 linux-arm64 macos-arm64

# Build for Linux (AMD64)
linux-amd64:
	@echo "Building for Linux (amd64)..."
	wails build -platform linux/amd64 -clean -tags webkit2_41

# Build for Linux (ARM64)
linux-arm64:
	@echo "Building for Linux (arm64)..."
	wails build -platform linux/arm64 -clean -tags webkit2_41

# Build for macOS (Apple Silicon / ARM64)
macos-arm64:
	@echo "Building for macOS (arm64)..."
	wails build -platform darwin/arm64 -clean

# Build all platforms at once using the Wails built-in comma-separated platform list
build-all:
	@echo "Building for all platforms at once..."
	wails build -platform linux/amd64,linux/arm64,darwin/arm64 -clean -tags webkit2_41

# Clean the build output directory
clean:
	@echo "Cleaning build directory..."
	rm -rf build/bin/*
