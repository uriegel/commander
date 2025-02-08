#if Linux
using CsTools.Extensions;
using GtkDotNet;
using GtkDotNet.SafeHandles;

namespace Linux;

public static class HeaderBar
{
    public static WidgetHandle Get(ApplicationHandle app, WindowHandle win)
        => Builder
                .FromDotNetResource("headerbar")
                .GetWidget("headerbar")
                .SideEffect(b =>
                    app.AddActions([
                        new("devtools", () => WebWindowNetCore.WebView.RunJavascript("WebView.showDevTools()"), "<Ctrl><Shift>I"),
                    ]));
}
#endif