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
                                .SubMenu("_Datei", Menu.New()
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Umbenennen", "app.rename"))
                                                        .AppendItem(MenuItem.New("Er_weitertes Umbenennen", "app.extendedrename"))
                                                        .AppendItem(MenuItem.New("Kopie _anlegen", "app.renameascopy"))))
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Kopieren", "app.copy"))))
                                                )))
                            .AppendItem(MenuItem.NewSection(null,
                                Menu.New()
                                .SubMenu("_Navigation", Menu.New()
                                                .AppendItem(MenuItem.NewSection(null,
                                                    Menu.New()
                                                        .AppendItem(MenuItem.New("_Favoriten", "app.favorites")))))))))
            .PackEnd(ToggleButton
                        .New()
                        .Ref(togglePreview)
                        .IconName("gtk-print-preview")
                        .Tooltip("Vorschau\tF3")
                        .OnClicked(() => OnTogglePreview(webView.Ref)))
            .PackEnd(Progress.New())
            .SideEffect(_ =>
                app.AddActions([
                    new("rename", () => SendMenuAction(webView.Ref, "RENAME"), "F2"),
                    new("extendedrename", () => SendMenuAction(webView.Ref, "EXTENDED_RENAME"), "<Ctrl>F2"),
                    new("renameascopy", () => SendMenuAction(webView.Ref, "RENAME_AS_COPY"), "<Shift>F2"),
                    new("copy", () => SendMenuAction(webView.Ref, "COPY"), "F5"),
                    new("favorites", () => SendMenuAction(webView.Ref, "FAVORITES"), "F1")
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

    static void OnTogglePreview(WebViewHandle webView)
    {
        Events.SendPreview(togglePreview.Ref.Active());
        webView.GrabFocus();
    }

    static readonly ObjectRef<ToggleButtonHandle> togglePreview = new();
}

#endif

