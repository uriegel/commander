#if Linux
using GtkDotNet;
using GtkDotNet.SafeHandles;
using GtkDotNet.SubClassing;

namespace Commander.Platform.Linux;

public static class Window
{
    public static void Register(ApplicationHandle app, WebWindowNetCore.WebView webView, string resourceTemplate)
        => app.SubClass(new CustomWindowClass(webView, resourceTemplate));
    
    class CustomWindowClass(WebWindowNetCore.WebView webView, string resourceTemplate)
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

    class CustomWindow(nint obj, WebWindowNetCore.WebView webView) : SubClassInst<ApplicationWindowHandle>(obj)
    {
        protected override async void OnCreate()
        {
            Handle.InitTemplate();
            Handle
                .GetTemplateChild<ButtonHandle, ApplicationWindowHandle>("devtools")
                ?.OnClicked(webView.ShowDevTools);
            dropdown = Handle.GetTemplateChild<DropDownHandle, ApplicationWindowHandle>("preview_mode");
            dropdown.OnNotify("selected", pm => Requests.SendJson(new(null, EventCmd.PreviewMode, new EventData { PreviewMode = pm.GetSelected().GetPreviewMode() })));
            await Task.Delay(50);

            Handle.AddActions(
                [
                    new("showhidden", false, show => Requests.SendJson(new(null, EventCmd.ShowHidden, new EventData { ShowHidden = show })), "<Ctrl>H"),
                    new("quit", Handle.CloseWindow, "<Ctrl>Q"),
                    new("devtools", webView.ShowDevTools, "<Ctrl><Shift>I"),
                    new("preview", false, show => Requests.SendJson(new(null, EventCmd.ShowViewer, new EventData { ShowViewer = show })), "F3"),
                    new("select-image", () => dropdown.SetSelected(0), "<CTRL>1"),
                    new("select-image-location", () => dropdown.SetSelected(1), "<CTRL>2"),
                    new("select-location", () => dropdown.SetSelected(2), "<CTRL>3"),
                    new("refresh", () => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "REFRESH" })), "<CTRL>R"),
                    new("favorites", () => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "FAVORITES" })), "F1"),
                    new("adaptpath", () => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "ADAPT_PATH" })), "F9"),
                    new("selectall", () => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "SEL_ALL" })), "KP_Add"),
                    new("selectnone", () => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "SEL_NONE" })), "KP_Subtract"),
                    new("createfolder", () => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "CREATE_FOLDER" })), "F7"),
                    new("delete", () => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "DELETE" })), "Löschen") // Shortcut not working!
                ]);
        }

        protected override void OnFinalize() => Console.WriteLine("Window finalized");
        protected override ApplicationWindowHandle CreateHandle(nint obj) => new(obj);
    }

    static string GetPreviewMode(this int pm)
    => pm == 0
        ? PreviewMode.IMAGE
        : pm == 1
        ? PreviewMode.IMAGE_LOCATION
        : PreviewMode.LOCATION;

    static DropDownHandle? dropdown = null;

}
#endif