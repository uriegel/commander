using System.Collections.Immutable;
using System.Data;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;

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

    static AsyncResult<GetExtendedItemsResult, RequestError> GetExtendedItems(string id, string path, string[] items)
    {
        extendedInfosCancellations = extendedInfosCancellations.Remove(id);
        extendedInfosCancellations = extendedInfosCancellations.Add(id, new());
        ExifData? GetExifDate(string file)
        {
            if (extendedInfosCancellations
                    .GetValue(id)
                    ?.IsCancellationRequested == true)
                return null;
            return null;  // TODO ExifReader.GetExifData(path.AppendPath(file));
        }

        ExifData? CheckGetExifDate(string item)
            => item.EndsWith(".jpg", StringComparison.InvariantCultureIgnoreCase) || item.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase)
                ? GetExifDate(item)
                : null;

        return Ok<GetExtendedItemsResult, RequestError>(new([.. items.Select(CheckGetExifDate)], path))
            .ToAsyncResult();
    }

    static DirectoryInfo CreateDirectoryInfo(this string path) => new(path);

    static ImmutableDictionary<string, CancellationTokenSource> extendedInfosCancellations
        = ImmutableDictionary<string, CancellationTokenSource>.Empty;
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
