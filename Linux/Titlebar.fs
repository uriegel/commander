module Titlebar
open GtkDotNet
open GtkDotNet.SafeHandles

let onShowHidden (webView: WebViewHandle) (show: bool) = 
    Events.events.TryFind "ShowHidden"
    |> Option.iter (fun send -> send show)
    webView.GrabFocus()

let sendMenuAction (webView: WebViewHandle) cmd = 
    Events.events.TryFind "MenuAction"
    |> Option.iter (fun send -> send cmd)
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
                            .AppendItem(MenuItem.New("_Versteckte Dateien", "app.showhidden"))))
                    .AppendItem(MenuItem.NewSection(null,
                            Menu.New()
                                .SubMenu("_Datei", Menu.New()
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Umbenennen", "app.rename"))
                                                        .AppendItem(MenuItem.New("Er_weitertes Umbenennen", "app.extendedrename"))
                                                        .AppendItem(MenuItem.New("Kopie _anlegen", "app.renameascopy"))))
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Kopieren", "app.copy"))
                                                        .AppendItem(MenuItem.New("_Verschieden", "app.move"))
                                                        .AppendItem(MenuItem.New("_Löschen\t\t\t\t\t\t\tEntf", "app.delete"))))
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Ordner anlegen", "app.createfolder"))))
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("Vorschaumodus wechseln", "app.togglePreviewMode")))))
                                .SubMenu("_Navigation", Menu.New()
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Favoriten", "app.favorites"))
                                                        .AppendItem(MenuItem.New("_Gleichen Ordner öffnen", "app.adaptpath")))))
                                .SubMenu("_Selektion", Menu.New()
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Alles", "app.selectall"))
                                                        .AppendItem(MenuItem.New("_Selektion entfernen", "app.selectnone")))))))))
                .PackEnd(ToggleButton
                            .New()
    //                        .Ref(togglePreview)
                            .IconName("gtk-print-preview")
                            .Tooltip("Vorschau\tF3"))
    //                        .OnClicked(() => OnTogglePreview(webView.Ref)))
                // .PackEnd(Progress.New())
                // .PackEnd(DeleteProgress.New())

    app.AddActions([
        GtkAction("refresh", (fun () -> sendMenuAction webview.Ref "REFRESH"), "<Ctrl>R")
        GtkAction("showhidden", false, (fun show -> onShowHidden webview.Ref show), "<Ctrl>H")
                // new("extendedrename", () => SendMenuAction(webView.Ref, "EXTENDED_RENAME"), "<Ctrl>F2"),
                // new("rename", () => SendMenuAction(webView.Ref, "RENAME"), "F2"),
                // new("togglePreviewMode", () => SendMenuAction(webView.Ref, "TOGGLE_PREVIEW"), "<Ctrl>F3"),
                // new("preview", () => {
                //     togglePreview.Ref.SetActive(!togglePreview.Ref.Active());
                //     Events.SendPreview(togglePreview.Ref.Active());                
                // }, "F3"),
                // new("renameascopy", () => SendMenuAction(webView.Ref, "RENAME_AS_COPY"), "<Shift>F2"),
                // new("copy", () => SendMenuAction(webView.Ref, "COPY"), "F5"),
                // new("move", () => SendMenuAction(webView.Ref, "MOVE"), "F6"),
                // new("delete", () => SendMenuAction(webView.Ref, "DELETE")),
                // new("createfolder", () => SendMenuAction(webView.Ref, "CREATE_FOLDER"), "F7"),
                // new("favorites", () => SendMenuAction(webView.Ref, "FAVORITES"), "F1"),
                // new("adaptpath", () => SendMenuAction(webView.Ref, "ADAPT_PATH"), "F9"),
                // new("selectall", () => SendMenuAction(webView.Ref, "SEL_ALL"), "KP_Add"),
                // new("selectnone", () => SendMenuAction(webView.Ref, "SEL_NONE"), "KP_Subtract"),
        GtkAction("devtools", (fun () -> webview.Ref.GetInspector().Show()), "<Shift><Ctrl>I")
    ]) |> ignore
    headerBar :> WidgetHandle

                


