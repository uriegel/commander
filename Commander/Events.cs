using AspNetExtensions;

record CopyProgress(
    string FileName,
    int    TotalCount,
    int    CurrentCount,
    int    CopyTime,
    long   TotalFileBytes,
    long   CurrentFileBytes,
    long   TotalBytes,
    long   CurrentBytes
);

record WindowState(bool Maximized);

record Events(
    string? Theme,
    CopyProgress? CopyProgress,
    WindowState? WindowState
#if Windows 
    , ServiceItem[]? ServiceItems = null
#endif
)
{
    public static void CopyProgressChanged(CopyProgress progress)
        => Source.Send(new Events(null, progress, null));
    public static void WindowStateChanged(bool isMaximized)
        => Source.Send(new Events(null, null, new(isMaximized)));

#if Windows 
    public static void ServiceItemsChanged(ServiceItem[] items)
        => Source.Send(new Events(null, null, null, items));
#endif

    static Events ThemeChanged(string theme)
        => new Events(theme, null, null);

    public static SseEventSource<Events> Source = SseEventSource<Events>.Create();   

    public static void StartEvents()   
        => global::Theme.StartThemeDetection(n => Source.Send(ThemeChanged(n)));
};