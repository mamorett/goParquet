<p align="center">
  <img src="build/appicon.png" width="128" alt="goParquet Logo">
</p>

<h1 align="center">goParquet</h1>

<p align="center">
  <strong>A modern, high-performance desktop application for viewing and managing image datasets stored in Apache Parquet files.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Wails-000000?style=for-the-badge&logo=wails&logoColor=white" alt="Wails">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

`goParquet` is designed for machine learning researchers and data scientists who need a fast, intuitive way to browse and curate massive image datasets indexed via Parquet. Built with Go for performance and Wails for a native desktop experience.

## ✨ Features

- 📂 **Parquet Integration**: Directly read and write metadata from `.parquet` files with high-level schema support.
- 🖼️ **Smart Image Gallery**: Ultra-fast browsing with on-the-fly thumbnail generation and caching.
- 🔍 **Advanced Filtering**: Filter by subdirectory, prompt, existence (found/missing), and full-text search across multiple fields.
- 📊 **Deep Metadata**: Real-time extraction of image dimensions, aspect ratio, file size, and megapixels.
- ✍️ **Description Editor**: Edit image descriptions and save them directly back to the Parquet database.
- 📈 **Dataset Statistics**: Instant overview of your dataset, including date ranges, unique prompts, and storage footprint.
- 🖥️ **Cross-Platform**: Native look and feel on Linux and macOS with optimized GPU acceleration.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed on your system.

### 1. Go (Programming Language)
`goParquet` requires **Go 1.22** or later.

- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt install golang-go
  ```
- **macOS:**
  ```bash
  brew install go
  ```
- **Windows / Manual:**
  Download and install from the [official Go website](https://go.dev/doc/install).

### 2. Node.js & NPM
Required for building the frontend.

- **Linux:**
  ```bash
  sudo apt install nodejs npm
  ```
- **macOS:**
  ```bash
  brew install node
  ```

### 3. Wails CLI
Wails is the framework used to build the desktop app.

- **Install Wails:**
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```
- **Verify Installation:**
  Run the following command to check if your system meets all requirements for Wails development:
  ```bash
  wails doctor
  ```

### 4. System Dependencies (Linux Only)
For Ubuntu/Debian, you'll need the following libraries for the WebKit2GTK webview:
```bash
sudo apt update
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev build-essential pkg-config
```

## 🛠️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/goParquet.git
cd goParquet
```

### 2. Build and Install

#### 🐧 Linux (Recommended)
You can build and install the application locally for your user. This will correctly set up the application icon and enable "Keep in dock" support in your desktop environment (GNOME, KDE, Plank, etc.).

```bash
# This builds the app and installs it to ~/.local/bin
make user-install
```

#### 🍎 macOS
```bash
# Build the application bundle
make build
```
The `.app` bundle will be located in `build/bin/`. You can move it to your `/Applications` folder manually.

### 3. Development Mode
To run the app in development mode with hot-reloading:
```bash
wails dev
```

## 📖 Usage

### Launching the App
Simply run the binary. You can select a Parquet file using the built-in file picker.

### CLI Arguments
You can also launch `goParquet` directly from the terminal and pre-load a specific database:

```bash
./goParquet --database path/to/your/data.parquet
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ using <a href="https://wails.io">Wails</a>
</p>
