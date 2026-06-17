using WebWindowNetCore;

class WebView
{
    public static DateTime StartTime { get; } = DateTime.Now;

    public static WebWindow Window { get; private set; } = null!;

    public static void Run()
    {
        Window = WebWindow
            .Builder()
            .AppId(Globals.APP_ID)
            .Title("Commander")
            .WithDiagnostics(true)
            .InitialBounds(600, 800)
            .SaveBounds()
            .DevTools()
            .DefaultContextMenuDisabled()
#if Windows
            .OnCreating(Form.OnCreate)
            .ResourceIcon("icon")
            .WithoutNativeTitlebar()
            .OnStateChange(w => Requests.SendJson(new(null, EventCmd.WindowState, new EventData { Maximized = w.IsMaximized })))
#else
            .FromResourceTemplate("template", Commander.Platform.Linux.Window.OnActivation, true)
#endif
            .DebugUrl($"http://localhost:5173/#platform={Globals.Platform}")
            .Url($"http://localhost:8080##platform={Globals.Platform}")
            .CanClose(BackgroundJobs.IsIdle)
            .Build();
        Window.Run();
    }
}

static class WebViewExtensions
{
#if Linux
    public static Commander.Platform.Linux.Window GetNative(this WebWindow ww) => (ww.Window as Commander.Platform.Linux.Window)!;
#endif
}