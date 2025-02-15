using System.Collections.Concurrent;
using System.Data;
using CsTools;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using WebServerLight;
using static CsTools.Core;

static partial class Directory
{
    public static AsyncResult<GetFilesResult, RequestError> GetFiles(GetFiles input)
        => input
            .Path
            .If(input.Mount == true, Mount)
            .CreateDirectoryInfo()
            .Validate()
            .Bind(n => GetFiles(n, input.ShowHiddenItems))
            //.Select(n => n.SideEffect(n => DirectoryWatcher.Initialize(getFiles.Id, n.Path)))
            .SelectError(e => new RequestError(e.Status, e.StatusText));

    public static Result<GetFilesResult, RequestError> GetFiles(DirectoryInfo dirInfo, bool showHiddenItems)
    {
        return
             Try(
                () => new DirFileInfo(
                    [.. dirInfo
                        .GetDirectories()
                        .Select(DirectoryItem.CreateDirItem)
                        .Where(FilterHidden)
                        .OrderBy(n => n.Name)],
                    dirInfo
                        .GetFiles()
                        .Select(DirectoryItem.CreateFileItem)
                        .Where(FilterHidden)
                        .ToArray()),
                e => IOErrorType.PathNotFound.ToError())
            .Select(MakeFilesResult);

        GetFilesResult MakeFilesResult(DirFileInfo dirFileInfo)
            => new([.. dirFileInfo.Directories, .. dirFileInfo.Files],
                    dirInfo.FullName,
                    dirFileInfo.Directories.Length,
                    dirFileInfo.Files.Length);

        bool FilterHidden(DirectoryItem item)
            => showHiddenItems || !item.IsHidden;
    }

    public static Result<Empty, RequestError> CancelExtendedItems(CancelExtendedItems param)
    {
        extendedInfosCancellations.TryRemove(param.Id, out var cts);
        cts?.Cancel();
        return new();
    }

    public static Task<Result<GetExtendedItemsResult, RequestError>> GetExtendedItems(GetExtendedItems param)
    {
        var cancellation = extendedInfosCancellations.AddOrUpdate(param.Id, new CancellationTokenSource(), (id, cts) =>
            {
                cts.Cancel();
                return new CancellationTokenSource();
            });

        return Task.Run(() => Ok<GetExtendedItemsResult, RequestError>(new(param.Items.Select(CheckGetExifDate), param.Path)));
        
        ExtendedItem CheckGetExifDate(string item)
            => cancellation.IsCancellationRequested == false
                ? new(GetExifDate(item), GetVersion(param.Path.AppendPath(item)))
                : new(null, null);

        ExifData? GetExifDate(string file)
            => file.EndsWith(".jpg", StringComparison.InvariantCultureIgnoreCase) || file.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase)
                ? ExifReader.GetExifData(param.Path.AppendPath(file))
                : null;
    }

    public static async Task<bool> ProcessFile(GetRequest request)
    {
        var filepath = request.QueryParts.GetValue("path")?.ReplacePathSeparatorForPlatform();
        if (filepath != null)
        {
            using var file = File.OpenRead(filepath);
            await request.SendAsync(file, (int)file.Length, MimeType.Get(filepath?.GetFileExtension()) ?? MimeTypes.ImageJpeg);
            return true;
        }
        else
            return false;
    }

    static DirectoryInfo CreateDirectoryInfo(this string path) => new(path);

    static readonly ConcurrentDictionary<string, CancellationTokenSource> extendedInfosCancellations = [];
}

enum IOErrorType
{
    Unknown,
    AccessDenied,
    AlreadyExists,
    FileNotFound,
    DeleteToTrashNotPossible,
    Exn,
    NetNameNotFound,
    PathNotFound,
    NotSupported,
    PathTooLong,
    Canceled,
    WrongCredentials,
    NoDiskSpace,
    OperationInProgress
}

static class IOErrorTypeExtensions
{
    public static RequestError ToError(this IOErrorType error)
        => new((int)error, error switch 
                                {
                                    IOErrorType.AccessDenied => "Access denied",
                                    IOErrorType.AlreadyExists => "Already exists",
                                    IOErrorType.FileNotFound => "File not found",
                                    IOErrorType.DeleteToTrashNotPossible => "Delete to trash not possible",
                                    IOErrorType.Exn => "Exception",
                                    IOErrorType.NetNameNotFound => "Net name not found",
                                    IOErrorType.PathNotFound => "Path not found",
                                    IOErrorType.NotSupported => "Not supported",
                                    IOErrorType.PathTooLong => "Path too long",
                                    IOErrorType.Canceled => "Canceled",
                                    IOErrorType.WrongCredentials => "Wrong credentials",
                                    IOErrorType.OperationInProgress => "Operation in Progress",
                                    _ => "Unknown"
                                });
} 

record DirFileInfo(
    DirectoryItem[] Directories,
    DirectoryItem[] Files
);

record GetFiles(
    string Id,
    string Path,
    bool ShowHiddenItems,
    bool? Mount
);

record GetFilesResult(
    DirectoryItem[] Items,
    string Path,
    int DirCount,
    int FileCount
);

record DirectoryItem(
    string Name,
    long Size,
    bool IsDirectory,
    string? IconPath,
    bool IsHidden,
    DateTime Time
) {
    public static DirectoryItem CreateDirItem(DirectoryInfo info)
        => new(
            info.Name,
            0,
            true,
            null,
            (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden,
            info.LastWriteTime);

    public static DirectoryItem CreateFileItem(FileInfo info)
        => new(
            info.Name,
            info.Length,
            false,
            Directory.GetIconPath(info),
            (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden,
            info.LastWriteTime);
};

record GetExtendedItems(
    string Id,
    string[] Items,
    string Path
);
record CancelExtendedItems(string Id);

record ExtendedItem(ExifData? ExifData, Version? Version);
record GetExtendedItemsResult(IEnumerable<ExtendedItem> ExtendedItems, string Path);

// TODO 
static class Extensions
{
    public static string ReplacePathSeparatorForPlatform(this string path)
#if Windows
        => path.Replace('/', '\\');
#else
        => path;
#endif
}