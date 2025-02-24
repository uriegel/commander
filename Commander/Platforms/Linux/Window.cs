#if Linux
using CsTools.Applicative;
using GtkDotNet;
using GtkDotNet.SubClassing;
using GtkDotNet.SafeHandles;
using WebWindowNetCore;

namespace Linux;

class CustomWindow(nint obj, WebView webView) : SubClassInst<ApplicationWindowHandle>(obj)
{
    public static void Register(ApplicationHandle app, WebView webView, string resourceTemplate)
        => app.SubClass(new CustomWindowClass(webView, resourceTemplate));

    protected override void OnCreate() => Handle.InitTemplate();

    protected override void Initialize()
    {
        Handle
            .GetTemplateChild<ButtonHandle, ApplicationWindowHandle>("devtools")
            ?.OnClicked(webView.ShowDevTools);
        // TODO Add to descriptions in Gtk4DotNet:
        // TODO <Ctrl>F3  b e f o r e  <F3> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        Handle.AddActions(
            [
                new("togglePreviewMode", Events.MenuAction.Apply("TOGGLE_PREVIEW"), "<Ctrl>F3"),
                new("showpreview", false, Events.PreviewAction, "F3"),
                new("copy", Events.MenuAction.Apply("COPY"), "F5"),
                new("createfolder", Events.MenuAction.Apply("CREATE_FOLDER"), "F7"),
                new("adaptpath", Events.MenuAction.Apply("ADAPT_PATH"), "F9"),
                new("delete", Events.MenuAction.Apply("DELETE")),
                new("refresh", Events.MenuAction.Apply("REFRESH"), "<Ctrl>R"),
                new("showhidden", false, Events.ShowHiddenAction, "<Ctrl>H"),
                new("devtools", webView.ShowDevTools, "<Ctrl><Shift>I"),
                new("quit", Handle.CloseWindow, "<Ctrl>Q"),
            ]);
    }
    
    class CustomWindowClass(WebView webView, string resourceTemplate)
        : SubClass<ApplicationWindowHandle>(GTypeEnum.ApplicationWindow, "CustomWindow", p => new CustomWindow(p, webView))
    {
        protected override void ClassInit(nint cls, nint _)
        {
            var webkitType = GType.Get(GTypeEnum.WebKitWebView);
            GType.Ensure(webkitType);
            var type = "WebKitWebView".TypeFromName();
            base.ClassInit(cls, _);
            InitTemplateFromResource(cls, resourceTemplate);
        }
    }

    protected override void OnFinalize() => Console.WriteLine("Window finalized");
    protected override ApplicationWindowHandle CreateHandle(nint obj) => new(obj);
}

#endif