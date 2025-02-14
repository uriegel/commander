#if Linux
using GtkDotNet;
using GtkDotNet.SafeHandles;
using WebWindowNetCore;

namespace Linux;

public static class HeaderBar
{
    public static void Build(WebView webView, ApplicationHandle app, WindowHandle win)
    {
        using var builder = Builder.FromDotNetResource("headerbar");
        win.Titlebar(builder.GetWidget("headerbar"));

        app.AddActions([
            new("devtools", webView.ShowDevTools, "<Ctrl><Shift>I"),
        ]);
    }
}

#endif