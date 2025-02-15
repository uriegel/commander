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

        // TODO Add to descriptions in Gtk4DotNet:
        // TODO <Ctrl>F3  b e f o r e  <F3> !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        app.AddActions([
            new("togglePreviewMode", Events.MenuAction.Apply("TOGGLE_PREVIEW"), "<Ctrl>F3"),
            new("showpreview", false, Events.PreviewAction, "F3"),            
            new("devtools", webView.ShowDevTools, "<Ctrl><Shift>I"),
        ]);
    }
}

#endif