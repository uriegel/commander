#if Linux
using CsTools.Applicative;
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
            new("showpreview", false, Events.PreviewAction, "F3"),            
            new("togglePreviewMode", Events.MenuAction.Apply("TOGGLE_PREVIEW"), "<Ctrl>F3"),
            new("devtools", webView.ShowDevTools, "<Ctrl><Shift>I"),
        ]);
    }
}

#endif