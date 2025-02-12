#if Linux
using System.Runtime.InteropServices;
using CsTools.Extensions;
using GtkDotNet;
using GtkDotNet.SafeHandles;

namespace Linux;

public static class HeaderBar
{
    public static void Build(ApplicationHandle app, WindowHandle win)
    {
        using var builder = Builder.FromDotNetResource("headerbar");
        win.Titlebar(builder.GetWidget("headerbar"));

        app.AddActions([
                new("devtools", () => WebWindowNetCore.WebView.RunJavascript("WebView.showDevTools()"), "<Ctrl><Shift>I"),
        ]);
    }
}

#endif