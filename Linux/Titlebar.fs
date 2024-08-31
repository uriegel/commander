module Titlebar
open GtkDotNet
open GtkDotNet.SafeHandles

let togglePreviewButton = ObjectRef<ToggleButtonHandle>()  

let onShowHidden (webView: WebViewHandle) (show: bool) = 
    Events.events.TryFind "ShowHidden"
    |> Option.iter (fun send -> send show)
    webView.GrabFocus()

let sendMenuAction (webView: WebViewHandle) cmd = 
    Events.events.TryFind "MenuAction"
    |> Option.iter (fun send -> send cmd)
    webView.GrabFocus()

let togglePreview (webView: WebViewHandle) fromShortcut () =
    let active = 
        if not fromShortcut then 
            togglePreviewButton.Ref.Active() 
        else 
            not (togglePreviewButton.Ref.Active())
    togglePreviewButton.Ref.SetActive active
    Events.events.TryFind "Preview"
    |> Option.iter (fun send -> send active)
    webView.GrabFocus()

let create (app: ApplicationHandle) (window: WindowHandle) (webview: ObjectRef<WebViewHandle>) =
    let headerBar = 
        HeaderBar.New()
            .PackEnd(MenuButton.New()
                .Direction(Arrow.None)
                .Model(Menu.New()
                    .AppendItem(MenuItem.NewSection(null,
                        Menu.New()
                            .AppendItem(MenuItem.New("_Aktualisieren", "app.refresh"))
                            .AppendItem(MenuItem.New("_Versteckte Dateien", "app.showhidden")))
                    )
                    .AppendItem(MenuItem.NewSection(null,
                            Menu.New()
                                .SubMenu("_Datei", Menu.New()
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Umbenennen", "app.rename"))
                                                        .AppendItem(MenuItem.New("Er_weitertes Umbenennen", "app.extendedrename"))
                                                        .AppendItem(MenuItem.New("Kopie _anlegen", "app.renameascopy")))
                                                )
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Kopieren", "app.copy"))
                                                        .AppendItem(MenuItem.New("_Verschieden", "app.move"))
                                                        .AppendItem(MenuItem.New("_Löschen\t\t\t\t\t\t\tEntf", "app.delete")))
                                                )
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Ordner anlegen", "app.createfolder")))
                                                )
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("Vorschaumodus wechseln", "app.togglePreviewMode")))
                                                )
                                )
                                .SubMenu("_Navigation", Menu.New()
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Favoriten", "app.favorites"))
                                                        .AppendItem(MenuItem.New("_Gleichen Ordner öffnen", "app.adaptpath")))
                                                )
                                )
                                .SubMenu("_Selektion", Menu.New()
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Alles", "app.selectall"))
                                                        .AppendItem(MenuItem.New("_Selektion entfernen", "app.selectnone"))))
                                )
                    ))
                )
            )
            .PackEnd(ToggleButton
                        .New()
                        .Ref(togglePreviewButton)
                        //.IconName("gtk-print-preview") // TODO Icon
                        .IconName("x-office-presentation")
                        .Tooltip("Vorschau\tF3")
                        .OnClicked(togglePreview webview.Ref false)
            )
            // .PackEnd(Progress.New())
            // .PackEnd(DeleteProgress.New())

    app.AddActions([
        GtkAction("refresh", (fun () -> sendMenuAction webview.Ref "REFRESH"), "<Ctrl>R")
        GtkAction("showhidden", false, onShowHidden webview.Ref, "<Ctrl>H")
                // new("extendedrename", () => SendMenuAction(webView.Ref, "EXTENDED_RENAME"), "<Ctrl>F2"),
                // new("rename", () => SendMenuAction(webView.Ref, "RENAME"), "F2"),
        GtkAction("togglePreviewMode", (fun () -> sendMenuAction webview.Ref "TOGGLE_PREVIEW"), "<Ctrl>F3")
        GtkAction("preview", togglePreview webview.Ref true, "F3")
                // new("renameascopy", () => SendMenuAction(webView.Ref, "RENAME_AS_COPY"), "<Shift>F2"),
                // new("copy", () => SendMenuAction(webView.Ref, "COPY"), "F5"),
                // new("move", () => SendMenuAction(webView.Ref, "MOVE"), "F6"),
                // new("delete", () => SendMenuAction(webView.Ref, "DELETE")),
                // new("createfolder", () => SendMenuAction(webView.Ref, "CREATE_FOLDER"), "F7"),
        GtkAction("favorites", (fun () -> sendMenuAction webview.Ref "FAVORITES"), "F1")
        GtkAction("adaptpath", (fun () -> sendMenuAction webview.Ref "ADAPT_PATH"), "F9")
        GtkAction("selectall", (fun () -> sendMenuAction webview.Ref "SEL_ALL"), "KP_Add")
        GtkAction("selectnone", (fun () -> sendMenuAction webview.Ref "SEL_NONE"), "KP_Subtract")
        GtkAction("devtools", (fun () -> webview.Ref.GetInspector().Show()), "<Shift><Ctrl>I")
    ]) |> ignore
    headerBar :> WidgetHandle

                


