namespace Native 
#if Linux
open GtkDotNet
open GtkDotNet.SafeHandles
open GtkDotNet

module Titlebar =
    let create (app: ApplicationHandle) (window: WindowHandle) (webview: ObjectRef<WebViewHandle>) =
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

                :> WidgetHandle
#endif    
                    


