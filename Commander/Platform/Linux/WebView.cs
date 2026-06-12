#if Linux

class LinuxWebView : WebView
{
    // TODO generic or platform specific
    public WebWindowNetCore.Linux.WebWindow LinuxWindow { get => (Window as WebWindowNetCore.Linux.WebWindow)!; } 

    public override void BackgroundActionActive()
    {
        // TODO generic or platform specific
        (LinuxWindow.Window as Commander.Platform.Linux.Window)?.BackgroundActionActive();
    }
}

#endif