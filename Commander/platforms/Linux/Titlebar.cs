#if Linux

using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using GtkDotNet;
using GtkDotNet.SafeHandles;
using static CsTools.Core;

record SetPreviewParam(bool Set);

static class TitleBar
{
    public static WidgetHandle New(ApplicationHandle app, WindowHandle _, ObjectRef<WebViewHandle> webView)
        => HeaderBar.New()
            .PackEnd(MenuButton
                        .New()
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
                                                        .AppendItem(MenuItem.New("_Löschen", "app.delete"))))
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Ordner anlegen", "app.createfolder")))))
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
                        .Ref(togglePreview)
                        .IconName("gtk-print-preview")
                        .Tooltip("Vorschau\tF3")
                        .OnClicked(() => OnTogglePreview(webView.Ref)))
            .PackEnd(Progress.New())
            .SideEffect(_ =>
                app.AddActions([
                    new("refresh", () => SendMenuAction(webView.Ref, "REFRESH"), "<Ctrl>R"),
                    new("showhidden", false, show => OnShowHidden(webView.Ref, show), "<Ctrl>H"),
                    new("rename", () => SendMenuAction(webView.Ref, "RENAME"), "F2"),
                    new("preview", () => {
                        togglePreview.Ref.SetActive(!togglePreview.Ref.Active());
                        Events.SendPreview(togglePreview.Ref.Active());                
                    }, "F3"),
                    new("extendedrename", () => SendMenuAction(webView.Ref, "EXTENDED_RENAME"), "<Ctrl>F2"),
                    new("renameascopy", () => SendMenuAction(webView.Ref, "RENAME_AS_COPY"), "<Shift>F2"),
                    new("copy", () => SendMenuAction(webView.Ref, "COPY"), "F5"),
                    new("move", () => SendMenuAction(webView.Ref, "MOVE"), "F6"),
                    new("delete", () => SendMenuAction(webView.Ref, "DELETE"), "Delete"),
                    new("createfolder", () => SendMenuAction(webView.Ref, "CREATE_FOLDER"), "F7"),
                    new("favorites", () => SendMenuAction(webView.Ref, "FAVORITES"), "F1"),
                    new("adaptpath", () => SendMenuAction(webView.Ref, "ADAPT_PATH"), "F9"),
                    new("selectall", () => SendMenuAction(webView.Ref, "SEL_ALL"), "KP_Add"),
                    new("selectnone", () => SendMenuAction(webView.Ref, "SEL_NONE"), "KP_Subtract"),
                    new("devtools", () => SendMenuAction(webView.Ref, "SHOW_DEV_TOOLS"), "F12"),
                ]));

    public static AsyncResult<Nothing, RequestError> SetPreview(SetPreviewParam param)
        => Ok<Nothing, RequestError>(0.ToNothing())
            .SideEffectWhenOk(_ => togglePreview.Ref.SetActive(param.Set))
            .ToAsyncResult();  

    static void SendMenuAction(WebViewHandle webView, string action)
    {
        Events.SendMenuAction(action);
        webView.GrabFocus();
    }  

    static void OnShowHidden(WebViewHandle webView, bool show)
    {
        Events.SendShowHidden(show);
        webView.GrabFocus();
    }  

    static void OnTogglePreview(WebViewHandle webView)
    {
        Events.SendPreview(togglePreview.Ref.Active());
        webView.GrabFocus();
    }

    static readonly ObjectRef<ToggleButtonHandle> togglePreview = new();
}

#endif

