# goParquet

A modern, high-performance desktop application for viewing and managing image datasets stored in **Apache Parquet** files. Built with [Wails](https://wails.io), Go, and Svelte/Vite.

![goParquet Logo](logo.png)

## Features

- **Parquet Integration**: Directly read and write metadata from `.parquet` files.
- **Image Gallery**: Fast browsing of local images linked in your database.
- **Advanced Filtering**: Filter by subdirectory, prompt, existence (found/missing), and full-text search.
- **Metadata Viewer**: Real-time image metadata extraction (dimensions, aspect ratio, file size, megapixels).
- **Description Editor**: Edit and save image descriptions back to the Parquet database.
- **Statistics**: Overview of your dataset (total entries, unique prompts, date ranges, etc.).
- **Cross-Platform**: Native look and feel on Linux and macOS.

## Prerequisites

### Local Development
- **Go**: 1.21 or later
- **Node.js**: 20.x or later
- **NPM**: Latest version
- **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Linux Dependencies (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev build-essential pkg-config
```

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/goParquet.git
cd goParquet
```

### 2. Install dependencies
```bash
# Frontend
cd frontend && npm install && cd ..
# Backend
go mod download
```

### 3. Run in Development Mode
```bash
wails dev
```

## Building

The project uses a `Makefile` to simplify the build process.

### Local Build (Auto-detects your OS/Arch)
```bash
make build
```
The binary will be generated in `build/bin/`.

### Native Compilation
If you prefer using the Wails CLI directly:
- **Linux**: `wails build -platform linux/amd64 -tags webkit2_41`
- **macOS**: `wails build -platform darwin/arm64`

## CI/CD & Releases

This project uses **GitHub Actions** for automated builds and releases.

- **Automated Builds**: Every time a new **Release** is published or created on GitHub, the workflow automatically builds binaries for:
  - Linux (AMD64)
  - Linux (ARM64)
  - macOS (Apple Silicon)
- **Release Assets**: Built binaries are automatically attached to the GitHub Release.

## Usage

You can launch the application and select a Parquet file via the UI, or launch it directly from the terminal with a database flag:

```bash
./goParquet --database path/to/your/data.parquet
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
