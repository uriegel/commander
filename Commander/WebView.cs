using System.Drawing;

static class WebView
{
    public static DateTime StartTime { get; } = DateTime.Now;
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
            .DefaultContextMenuDisabled()
            .BackgroundColor(Color.Transparent)
#if Windows
            .OnFormCreating(Form.OnCreate)
            .ResourceIcon("icon")
            .WithoutNativeTitlebar()
#else
            .FromAdwResourceTemplate("template", Commander.Platform.Linux.Window.Register)
#endif
            .DebugUrl($"http://localhost:5173/#platform={Globals.Platform}")
            .Url($"http://localhost:8080##platform={Globals.Platform}")
            .CanClose(BackgroundJobs.IsIdle);
    
    public static readonly WebWindowNetCore.WebView webView;
}