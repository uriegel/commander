#if Windows

using WebWindowNetCore;

static class Form
{
    public static WebWindow WebWindow { get; private set; } = null!;
    public static async void OnCreate(WebWindow window)
    {
        WebWindow = window;
        await Task.Delay(1000);
        Requests.SendJson(new(null, EventCmd.WindowState, new EventData { Maximized = window.IsMaximized }));
    }
}

#endif