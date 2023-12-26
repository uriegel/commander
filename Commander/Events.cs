using System.Reactive.Subjects;
using AspNetExtensions;
using CsTools.Extensions;
using CsTools.Functional;

record CopyProgress(
    string FileName,
    int    TotalCount,
    int    CurrentCount,
    int    CopyTime,
    long   TotalFileBytes,
    long   CurrentFileBytes,
    long   TotalBytes,
    long   CurrentBytes,
    bool   IsStarted,
    bool   IsFinished
);

record WindowState(bool Maximized);

record FilesDrop(string Id, bool Move, string Path, DirectoryItem[] Items);

record GetCredentials(string Path);

record Events(
    string? Theme,
    CopyProgress? CopyProgress,
    WindowState? WindowState,
    FilesDrop? FilesDrop
#if Windows
    , GetCredentials? GetCredentials = null
    , ServiceItem[]? ServiceItems = null
#endif
)
{
    public static IObservable<CopyProgress> CopyProgresses { get => copyProgresses; }

    public static void CopyProgressChanged(CopyProgress progress)
        => copyProgresses.OnNext(progress);

    public static void CopyStarted()
        => copyProgresses
            .SideEffect(_ => currentCopyId = GetCopyId())
            .OnNext(new("", 0, 0, 0, 0, 0, 0, 0, true, false));

    public static async void CopyFinished()
    {
        var thisCopyId = currentCopyId;
        await Task.Delay(TimeSpan.FromSeconds(5));
        if (thisCopyId == currentCopyId)
            copyProgresses.OnNext(new("", 0, 0, 0, 0, 0, 0, 0, false, true));
    }        

    public static void WindowStateChanged(bool isMaximized)
        => Source.Send(DefaultEvents with { WindowState = new(isMaximized) });
    public static void FilesDropped(FilesDrop filesDrop)
        => Source.Send(DefaultEvents with { FilesDrop = filesDrop });

#if Windows 
    public static void Credentials(string path)
        => Source.Send(DefaultEvents with { GetCredentials = new(path) });

    public static void ServiceItemsChanged(ServiceItem[] items)
        => Source.Send(DefaultEvents with { ServiceItems = items });
#endif

    public static SseEventSource<Events> Source = SseEventSource<Events>.Create();   

    public static void StartEvents()   
        => global::Theme.StartThemeDetection(n => Source.Send(ThemeChanged(n)));

    static Events DefaultEvents { get; } = new(null, null, null, null);

    static Events ThemeChanged(string theme)
        => DefaultEvents with { Theme = theme };

    static Events()
        => copyProgresses.Subscribe(n => Source.Send(DefaultEvents));

    static readonly Func<int> GetCopyId = Incrementor.UseInt();
    static int currentCopyId;
    static readonly Subject<CopyProgress> copyProgresses = new();
};