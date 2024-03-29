using System.Reactive.Subjects;
using AspNetExtensions;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;

record CopyProgress(
    string FileName,
    bool   IsMove,
    int    TotalCount,
    int    CurrentCount,
    int    CopyTime,
    long   TotalFileBytes,
    long   CurrentFileBytes,
    long   TotalBytes,
    long   CurrentBytes,
    bool   IsStarted,
    bool   IsFinished,
    bool   IsDisposed
);

record WindowState(bool Maximized);

record FilesDrop(string Id, bool Move, string Path, DirectoryItem[] Items);

record GetCredentials(string Path);

enum DirectoryChangedType
{
    Created,
    Changed,
    Renamed,
    Deleted
}

record DirectoryChangedEvent(
    string FolderId,
    string? Path,
    DirectoryChangedType Type,
    DirectoryItem Item,
    string? OldName
);

record ExifTime(
    string Path,
    string Name,
    DateTime Exif
);

record Events(
    string? Theme,
    CopyProgress? CopyProgress,
    WindowState? WindowState,
    FilesDrop? FilesDrop,
    DirectoryChangedEvent? DirectoryChanged,
    ExifTime? ExifTime,
    ExtendedData? ExtendedData,
    RequestError? CopyError
#if Windows
    , GetCredentials? GetCredentials = null
    , ServiceItem[]? ServiceItems = null
    , bool? ShowProgress = null
#endif
)
{
    public static IObservable<CopyProgress> CopyProgresses { get => copyProgresses; }

    public static void CopyProgressChanged(CopyProgress progress)
        => copyProgresses.OnNext(progress);

    public static void SendCopyError(RequestError error)
        => Source.Send(DefaultEvents with { CopyError = error });

    public static void CopyStarted(bool move)
        => copyProgresses
            .SideEffect(_ => currentCopyId = GetCopyId())
            .OnNext(new("", move, 0, 0, 0, 0, 0, 0, 0, true, false, false));

    public static async void CopyFinished()
    {
        var thisCopyId = currentCopyId;
        copyProgresses.OnNext(new("", false, 0, 0, 0, 0, 0, 0, 0, false, true, false));
        await Task.Delay(TimeSpan.FromSeconds(5));
        if (thisCopyId == currentCopyId)
            copyProgresses.OnNext(new("", false, 0, 0, 0, 0, 0, 0, 0, false, false, true));
    }        

    public static void WindowStateChanged(bool isMaximized)
        => Source.Send(DefaultEvents with { WindowState = new(isMaximized) });
    public static void FilesDropped(FilesDrop filesDrop)
        => Source.Send(DefaultEvents with { FilesDrop = filesDrop });

    public static void SendDirectoryChanged(string folderId, string? path, DirectoryChangedType type, DirectoryItem item, string? oldName = null)
        => Source.Send(DefaultEvents with { DirectoryChanged = new(folderId, path, type, item, oldName) });

    public static void SendExif(string path, string name, DateTime exifTime)
        => Source.Send(DefaultEvents with { ExifTime = new(path, name, exifTime) });

    public static void SendExtendedData(string path, string name, ExtendedData extendedData)
        => Source.Send(DefaultEvents with { ExtendedData = extendedData });

#if Windows 
    public static void Credentials(string path)
        => Source.Send(DefaultEvents with { GetCredentials = new(path) });

    public static void ServiceItemsChanged(ServiceItem[] items)
        => Source.Send(DefaultEvents with { ServiceItems = items });

    public static void ShowProgressChanged()
        => Source.Send(DefaultEvents with { ShowProgress = true });
#endif

    public static SseEventSource<Events> Source = SseEventSource<Events>.Create();   

    public static void StartEvents()   
        => global::Theme.StartThemeDetection(n => Source.Send(ThemeChanged(n)));

    static Events DefaultEvents { get; } = new(null, null, null, null, null, null, null, null);

    static Events ThemeChanged(string theme)
        => DefaultEvents with { Theme = theme };

    static Events()
        => copyProgresses.Subscribe(n => Source.Send(DefaultEvents with { CopyProgress = n }));

    static readonly Func<int> GetCopyId = Incrementor.UseInt();
    static int currentCopyId;
    static readonly Subject<CopyProgress> copyProgresses = new();
};