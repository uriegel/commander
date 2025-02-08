#if Linux
using CsTools.Extensions;
using GtkDotNet;
using GtkDotNet.SafeHandles;

namespace Linux;

public static class HeaderBar
{
    public static BuilderHandle WithBuilder(ApplicationHandle app)
        => Builder
                .FromDotNetResource("ui")
                .SideEffect(b => 
                    app.AddActions([
                        new("devtools", () => WebWindowNetCore.WebView.RunJavascript("WebView.showDevTools()"), "<Ctrl><Shift>I"),                                                
                    ]));
}
#endif