package main

import (
    "embed"

    "github.com/wailsapp/wails/v2"
    "github.com/wailsapp/wails/v2/pkg/options"
    "github.com/wailsapp/wails/v2/pkg/options/assetserver"
    "github.com/wailsapp/wails/v2/pkg/options/linux"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
    app := NewApp()
    err := wails.Run(&options.App{
        Title:     "goParquet",
        Width:     1280,
        Height:    900,
        MinWidth:  900,
        MinHeight: 600,
        AssetServer: &assetserver.Options{
            Assets: assets,
        },
        BackgroundColour: &options.RGBA{R: 46, G: 52, B: 64, A: 255}, // #2E3440
        OnStartup:        app.startup,
        Linux: &linux.Options{
            Icon:             icon,
            WebviewGpuPolicy: linux.WebviewGpuPolicyAlways,
        },
        Bind: []interface{}{
            app,
        },
    })
    if err != nil {
        println("Error:", err.Error())
    }
}
