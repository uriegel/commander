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
)
{
    public static void CopyProgressChanged(CopyProgress progress)
        => Source.Send(new Events(null, progress, null));
    static Events ThemeChanged(string theme)
        => new Events(theme, null, null);

    static Events WindowStateChanged(bool isMaximized)
        => new Events(null, null, new(isMaximized));

    public static SseEventSource<Events> Source = SseEventSource<Events>.Create();   

    public static void StartEvents()   
        => global::Theme.StartThemeDetection(n => Source.Send(ThemeChanged(n)));
};