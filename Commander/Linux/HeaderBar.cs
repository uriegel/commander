#if Linux
using CsTools.Extensions;
using GtkDotNet;
using GtkDotNet.SafeHandles;

namespace Linux;

public static class HeaderBar
{
    public static BuilderHandle WithBuilder()
    {
        return Builder
                .FromDotNetResource("ui");
                // .SideEffect(b => b.GetObject<ButtonHandle>("devtools", b => b
                //     .OnClicked(() => WebWindowNetCore.WebView.RunJavascript("WebView.showDevTools()"))));
    }
}
#endif