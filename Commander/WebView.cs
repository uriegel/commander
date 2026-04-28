using System.Drawing;

static class WebView
{
    public static void Run() => webView.Run();

    public static void ShowDevTools() => webView.ShowDevTools();

    static WebView() => 
        webView = WebWindowNetCore.WebView
            .Create()
            .AppId(Globals.APP_ID)
            .Title("Commander")
            .InitialBounds(600, 800)
            .SaveBounds()
            .DevTools()
            .BackgroundColor(Color.Transparent)
#if Windows
            .OnFormCreating(Form.OnCreate)
            .ResourceIcon("icon")
            .WithoutNativeTitlebar()
#else
            .FromResourceTemplate("template", Commander.Platform.Linux.Window.Register)
#endif
            .DebugUrl("http://localhost:5173/")
            .Url("http://localhost:8080")
            .CanClose(BackgroundJobs.IsIdle);
    
    public static readonly WebWindowNetCore.WebView webView;
}