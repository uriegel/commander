using System.Data;
using System.Collections.Immutable;
using Microsoft.AspNetCore.Http;

using AspNetExtensions;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools;

using static CsTools.Functional.Tree;
using static CsTools.Core;
using CsTools.HttpRequest;

static partial class Directory
{
    public static AsyncResult<GetFilesResult, GetFilesError> GetFiles(GetFiles getFiles)
        => getFiles
            .Path
            .If(getFiles.Mount == true,
                Mount)
            .CreateDirectoryInfo()
            .Validate()
            .Bind(n => GetFiles(n, getFiles.ShowHiddenItems))
            .Select(n => n.SideEffect(n => DirectoryWatcher.Initialize(getFiles.Id, n.Path)))
            .SelectError(e => new GetFilesError(getFiles.Path, e.Status, e.StatusText));

    public static AsyncResult<Nothing, GetFilesError> CancelExtendedItems(CancelExtendedItems cancelExtendedItems)
        => Ok<Nothing, GetFilesError>(nothing)
            .SideEffect(_ => extendedInfosCancellations.GetValue(cancelExtendedItems.Id)?.Cancel())
            .ToAsyncResult();
    
    public static async Task ProcessFile(HttpContext context, string path)
    {
        using var stream = path.OpenFile();
        await (path.UseRange()
            ? context.StreamRangeFile(path)
            : context.SendStream(stream, null, path));
    }

    public static async Task ProcessFavicon(HttpContext context)
    {
        var icon = Resources.Get("icon");
        var ms = new MemoryStream();
        icon?.CopyTo(ms);
        ms.Position = 0;
        await context.SendStream(ms, null, "favicon.png");
    }

    public static AsyncResult<CopyItemInfo[], RequestError> CopyItemsInfo(CopyItemsParam input)
    {
        return Try(
            () => input.Items.FlattenTree(Resolver, CreateCopyItemInfo, IsDirectory, new CancellationTokenSource(TimeSpan.FromSeconds(10)).Token,
                            AppendSubPath, (string?)null).ToArray(),
            MapException)
                .ToAsyncResult();

        (IEnumerable<CopyItem>, string?) Resolver(CopyItem item, string? subPath)
            => (GetCopyItems(subPath.AppendPath(item.Name)), item.Name);

        IEnumerable<CopyItem> GetCopyItems(string subPath)
        {
            var info = new DirectoryInfo(input.Path.AppendPath(subPath));
            var dirInfos = info
                            .GetDirectories()
                            .Select(n => new CopyItem(n.Name, true, 0, DateTime.MinValue, null));
            var fileInfos = info
                                .GetFiles()
                                .Select(n => new CopyItem(n.Name, false, n.Length, n.LastWriteTime, null));
            return fileInfos.Concat(dirInfos);
        }

        CopyItemInfo CreateCopyItemInfo(CopyItem copyItem, string? subPath) 
        {
            var targetFile = input.TargetPath.AppendPath(subPath).AppendPath(copyItem.Name);
            var fi = new FileInfo(targetFile);
            return new CopyItemInfo(
                copyItem.Name, 
                subPath ?? "", 
                copyItem.Size, 
                copyItem.Time, 
                fi.Exists ? fi.Length : null, 
                fi.Exists ? fi.LastWriteTime : null);
        }

        string AppendSubPath(string? initialPath, string? subPath)
            => initialPath.AppendPath(subPath);

        bool IsDirectory(CopyItem item, string? subPath)
            => item.IsDirectory == true;
    }

    public static void FilesDropped(string id, bool move, string[] paths)
        => Events.FilesDropped(new FilesDrop(
            id,
            move,
            new DirectoryInfo(paths[0]).Parent?.FullName ?? "",
            paths
                .Select(n => IsDirectory(n)
                            ? DirectoryItem.CreateDirItem(new DirectoryInfo(n))
                            : DirectoryItem.CreateFileItem(new FileInfo(n)))
                .ToArray()));

    public static AsyncResult<Nothing, RequestError> RenameItems(RenameItemsParam input)
    {
        var res = input.Items.Aggregate(Ok<Nothing, RequestError>(nothing), (r, i) => r.SelectMany(_ => PreRenameItem(i)));
        res = input.Items.Aggregate(res, (r, i) => r.SelectMany(_ => RenameItem(i)));
        return res.ToAsyncResult();

        Result<Nothing, RequestError> PreRenameItem(RenameItem item)
            => Move(input.Path.AppendPath(item.Name), input.Path.AppendPath("__RENAMING__" + item.NewName));
        Result<Nothing, RequestError> RenameItem(RenameItem item)
            => Move(input.Path.AppendPath("__RENAMING__" + item.NewName), input.Path.AppendPath(item.NewName));
    }

    public static AsyncResult<Nothing, RequestError> RenameAsCopy(RenameItemParam input)
        => Try(
            () => nothing
                    .SideEffect(_ => File.Copy(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName))),
            MapExceptionToRequestError)
                .ToAsyncResult();

    public static AsyncResult<Nothing, RequestError> OnEnter(OnEnterParam input)
        => Ok<Nothing, RequestError>(nothing)
            .SideEffect(_ => OnEnter(input.Path, input.Keys))
            .ToAsyncResult();

    public static Result<GetFilesResult, RequestError> GetFiles(DirectoryInfo dirInfo, bool showHiddenItems)
    {
        // TODO When directory not found => root
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
            => new ([.. dirFileInfo.Directories, .. dirFileInfo.Files],
                    dirInfo.FullName,
                    dirFileInfo.Directories.Length,
                    dirFileInfo.Files.Length);

        bool FilterHidden(DirectoryItem item)
            => showHiddenItems || !item.IsHidden;
    }

    public static bool IsDirectory(string path)
        => (File.GetAttributes(path) & FileAttributes.Directory) == FileAttributes.Directory;

    public static RequestError ErrorToRequestError(DirectoryError de)
        => de switch
        {
            DirectoryError.AccessDenied      => IOErrorType.AccessDenied.ToError(),
            DirectoryError.DirectoryNotFound => IOErrorType.PathNotFound.ToError(),
            DirectoryError.NotSupported      => IOErrorType.NotSupported.ToError(),
            DirectoryError.PathTooLong       => IOErrorType.PathTooLong.ToError(),
            _                                => IOErrorType.Exn.ToError()
        };
    static RequestError MapExceptionToRequestError(Exception e)
        => e switch
        {
            IOException ioe when ioe.HResult == 13 => IOErrorType.AccessDenied.ToError(),
            IOException ioe when ioe.HResult == -2147024891 => IOErrorType.AccessDenied.ToError(),
            UnauthorizedAccessException ue => IOErrorType.AccessDenied.ToError(),
            _ => IOErrorType.Exn.ToError()
        };

    static AsyncResult<GetExtendedItemsResult, GetFilesError> GetExtendedItems(string id, string path, string[] items)
    {
        extendedInfosCancellations = extendedInfosCancellations.Remove(id);
        extendedInfosCancellations = extendedInfosCancellations.Add(id, new());
        DateTime? GetExifDate(string file)
        {
            if (extendedInfosCancellations
                    .GetValue(id)
                    ?.IsCancellationRequested == true)
                return null;
            return ExifReader.GetDateTime(path.AppendPath(file));
        }

        DateTime? CheckGetExifDate(string item)
            => item.EndsWith(".jpg", StringComparison.InvariantCultureIgnoreCase) || item.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase)
                ? GetExifDate(item)
                : null;

        return Ok<GetExtendedItemsResult, GetFilesError>(new(items.Select(CheckGetExifDate).ToArray(), path))
                    .ToAsyncResult();
    }

    static AsyncResult<Nothing, RequestError> RenameItemRaw(RenameItemParam input)
        =>  Move(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName))
                .ToAsyncResult();

    static AsyncResult<Nothing, RequestError> CreateFolderRaw(CreateFolderParam input)
        => CreateFolder(input.Name, input.Path)
            .ToAsyncResult();

    static bool UseRange(this string path)
        => path.EndsWith(".mp4", StringComparison.InvariantCultureIgnoreCase) 
        || path.EndsWith(".mp3", StringComparison.InvariantCultureIgnoreCase);

    static ImmutableDictionary<string, CancellationTokenSource> extendedInfosCancellations
        = ImmutableDictionary<string, CancellationTokenSource>.Empty;

    static DirectoryInfo CreateDirectoryInfo(this string path) => new(path);
}

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

record GetFiles(
    string Id, 
    string Path,
    bool ShowHiddenItems,
    bool? Mount
);

record DirFileInfo(
    DirectoryItem[] Directories,
    DirectoryItem[] Files
);

record GetFilesResult(
    DirectoryItem[] Items,
    string Path,
    int DirCount,
    int FileCount
);

record GetFilesError(string Path, int Status, string StatusText) 
    : RequestError(Status, StatusText);

record GetFilesRequestResult(
    DirectoryItem[] Items,
    string Path,
    int DirCount,
    int FileCount,
    IOErrorType Error
);

record GetExtendedItems(
    string Id,
    string[] Items,
    string Path
);

record CancelExtendedItems(string Id);

record FileCopyAggregateItem(
    long Bytes,
    int Count,
    DateTime StartTime
);

record FileRequest(string Path);

record CreateFolderParam(
    string Path,
    string Name
);

record RenameItemParam(
    string Path,
    string Name,
    string NewName
);

record RenameItem(
    string Name,
    string NewName
);

record RenameItemsParam(
    string Path,
    RenameItem[] Items
);

record DeleteItemsParam(
    string Path,
    string[] Names
);

record CopyItem(
    string Name,
    bool? IsDirectory,
    long Size,
    DateTime Time,
    string? SubPath 
);

record CopyItemInfo(
    string Name,
    string SubPath,
    long Size,
    DateTime Time,
    long? TargetSize,
    DateTime? TargetTime
);

record CopyItemsParam(
    string Path,
    string TargetPath,
    CopyItem[] Items,
    bool Move
);

record OnEnterParam(
    string Path,
    SpecialKeys? Keys
);

enum IOErrorType {
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
    NoDiskSpace
}

record IOResult(IOErrorType Type, string? Path = null);
static class IOResultExt
{
    public static IOResult AppendPath(this IOResult res, string path)
        => res with { Path = path };
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
                                    _ => "Unknown"
                                });
} 

record CopyItemsResult(
    CopyItemInfo[]? Infos,
    IOErrorType? Error = null);

record SpecialKeys(
    bool Alt,
    bool Ctrl,
    bool Shift
);
