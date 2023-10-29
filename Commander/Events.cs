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

record Events(
    string? Theme,
    CopyProgress? CopyProgress)
{
    public static void CopyProgressChanged(CopyProgress progress)
        => Source.Send(new Events(null, progress));
    static Events ThemeChanged(string theme)
        => new Events(theme, null);

    public static SseEventSource<Events> Source = SseEventSource<Events>.Create();   

    public static void StartEvents()   
        => global::Theme.StartThemeDetection(n => Source.Send(ThemeChanged(n)));
};