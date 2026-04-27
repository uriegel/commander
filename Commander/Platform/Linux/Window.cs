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
            dropdown.OnNotify("selected", FocusAfter1<DropDownHandle>(pm => Requests.SendJson(new(null, EventCmd.PreviewMode, new EventData { PreviewMode = pm.GetSelected().GetPreviewMode() }))));
            webview = Handle.GetTemplateChild<WebViewHandle, ApplicationWindowHandle>("webview");
            await Task.Delay(50);

            Handle.AddActions(
                [
                    new("showhidden", false, FocusAfter1<bool>(show => Requests.SendJson(new(null, EventCmd.ShowHidden, new EventData { ShowHidden = show }))), "<Ctrl>H"),
                    new("quit", FocusAfter(Handle.CloseWindow), "<Ctrl>Q"),
                    new("devtools", FocusAfter(webView.ShowDevTools), "<Ctrl><Shift>I"),
                    new("preview", false, FocusAfter1<bool>(show => Requests.SendJson(new(null, EventCmd.ShowViewer, new EventData { ShowViewer = show }))), "F3"),
                    new("select-image", FocusAfter(() => dropdown.SetSelected(0)), "<CTRL>1"),
                    new("select-image-location", FocusAfter(() => dropdown.SetSelected(1)), "<CTRL>2"),
                    new("select-location", FocusAfter(() => dropdown.SetSelected(2)), "<CTRL>3"),
                    new("refresh", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "REFRESH" }))), "<CTRL>R"),
                    new("favorites", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "FAVORITES" }))), "F1"),
                    new("adaptpath", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "ADAPT_PATH" }))), "F9"),
                    new("selectall", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "SEL_ALL" }))), "KP_Add"),
                    new("selectnone", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "SEL_NONE" }))), "KP_Subtract"),
                    new("createfolder", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "CREATE_FOLDER" }))), "F7"),
                    new("delete", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "DELETE" }))), "Löschen"), // Shortcut not working!
                    new("toggleselection", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "TOGGLE_SEL" }))), "Insert")
                ]);

            Action FocusAfter(Action action)
            {
                return Run;
                void Run()
                {
                    action();
                    webview?.GrabFocus();
                };
            }    
            Action<T> FocusAfter1<T>(Action<T> action)
            {
                return Run;
                void Run(T t)
                {
                    action(t);
                    webview?.GrabFocus();
                };
            }    
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
    static WebViewHandle? webview = null;

}
#endif