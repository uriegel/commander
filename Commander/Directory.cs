using System.Data;
using System.Collections.Immutable;
using Microsoft.AspNetCore.Http;

using AspNetExtensions;
using CsTools.Extensions;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;

using static System.IO.Directory;
using static CsTools.Functional.Tree;
using CsTools.Functional;

using static CsTools.Core;
using CsTools;

static partial class Directory
{
    public static Task<GetFilesRequestResult> GetFiles(GetFiles getFiles)
        => getFiles
            .Path
            .If(getFiles.Mount == true,
                Mount)
            .CreateDirectoryInfo()
            .Validate()
            .SelectMany(n => GetFiles(n, getFiles.ShowHiddenItems))
            .SelectError(e => e.AppendPath(getFiles.Path))
            .ToRequestResult()
            .ToAsync();

    public static GetExtendedItemsResult GetExtendedItems(string id, string path, string[] items)
    {
        extendedInfosCancellations = extendedInfosCancellations.Remove(id);
        extendedInfosCancellations = extendedInfosCancellations.Add(id, new());
        DateTime? GetExifDate(string file)
        {
            if (extendedInfosCancellations
                    .GetValue(id)
                    ?.IsCancellationRequested == true)
                return null;
            try
            {
                var directories = ImageMetadataReader.ReadMetadata(path.AppendPath(file));
                var subIfdDirectory = directories.OfType<ExifSubIfdDirectory>().FirstOrDefault();
                return (subIfdDirectory
                        ?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal)
                        .WhiteSpaceToNull()
                        ?? subIfdDirectory
                            ?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal)
                            .WhiteSpaceToNull()
                        ?? "")
                            .ToDateTime("yyyy:MM:dd HH:mm:ss");
            }
            catch { return null; }
        }

        DateTime? CheckGetExifDate(string item)
            => item.EndsWith(".jpg", StringComparison.InvariantCultureIgnoreCase) || item.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase)
                ? GetExifDate(item)
                : null;

        return new(items.Select(CheckGetExifDate).ToArray(), path);
    }

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

    public static Task<IOResult> CreateFolder(CreateFolderParam input)
        => Try(
            () => CreateDirectory(input.Path.AppendPath(input.Name)).ToNothing(),
            MapExceptionToIOError)
                .ToIOResult()
                .ToAsync();

    public static Task<IOResult> CancelExtendedItems(CancelExtendedItems cancelExtendedItems)
    {
        extendedInfosCancellations.GetValue(cancelExtendedItems.Id)?.Cancel();        
        return new IOResult(IOErrorType.NoError).ToAsync();
    }

    public static Task<CopyItemsResult> CopyItemsInfo(CopyItemsParam input)
    {
        return CopyItemsInfo()
                .Catch(MapExceptionToCopyItems);

        async Task<CopyItemsResult> CopyItemsInfo()
            => await new CopyItemsResult(input.Items.FlattenTree(Resolver, CreateCopyItemInfo, IsDirectory, new CancellationTokenSource(TimeSpan.FromSeconds(10)).Token,
                        AppendSubPath, (string?)null).ToArray())
                    .ToAsync();

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
            => item.isDirectory == true;
        
        static CopyItemsResult MapExceptionToCopyItems(Exception e)
            => new(null, MapExceptionToIOError(e).Type);            
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

    // public static Task<IOResult> CancelCopy(Empty _)
    //     => new IOResult(IOErrorType.NoError)
    //         .ToAsync()
    //         .SideEffect(Cancellation.Cancel);

    public static Task<IOResult> RenameItems(RenameItemsParam input)
    {
        return Try(
            () => {
                input.items.ForEach(PreRenameItem);
                input.items.ForEach(RenameItem);
            },
            MapExceptionToIOError)
                .ToIOResult()
                .ToAsync();
        void PreRenameItem(RenameItem item)
            => Move(input.Path.AppendPath(item.Name), input.Path.AppendPath("__RENAMING__" + item.NewName));
        void RenameItem(RenameItem item)
            => Move(input.Path.AppendPath("__RENAMING__" + item.NewName), input.Path.AppendPath(item.NewName));
    }

    public static Task<IOResult> RenameAndCopy(RenameItemParam input)
        => Try(
            () => File.Copy(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName)),
            MapExceptionToIOError)
                .ToIOResult()
                .ToAsync();

    public static Task<IOResult> OnEnter(OnEnterParam input)
        => new IOResult(IOErrorType.NoError)
            .SideEffect(_ => OnEnter(input.Path, input.Keys))
            .ToAsync();

    public static Result<GetFilesResult, IOResult> GetFiles(DirectoryInfo dirInfo, bool showHiddenItems)
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
                e => new IOResult(IOErrorType.PathNotFound, null))
            .Select(MakeFilesResult);

        GetFilesResult MakeFilesResult(DirFileInfo dirFileInfo)
            => new ([.. dirFileInfo.Directories, .. dirFileInfo.Files],
                    dirInfo.FullName,
                    dirFileInfo.Directories.Length,
                    dirFileInfo.Files.Length);

        bool FilterHidden(DirectoryItem item)
            => showHiddenItems || !item.IsHidden;
    }

    public static IOResult ErrorToIOError(DirectoryError de)
        => de switch
        {
            DirectoryError.AccessDenied      => new(IOErrorType.AccessDenied),
            DirectoryError.DirectoryNotFound => new(IOErrorType.PathNotFound),
            DirectoryError.NotSupported      => new(IOErrorType.NotSupported),
            DirectoryError.PathTooLong       => new(IOErrorType.PathTooLong),
            _                                => new(IOErrorType.Exn)
        };

    static AsyncResult<Nothing, RequestError> RenameItemRaw(RenameItemParam input)
        =>  Move(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName))
                .ToAsyncResult();

    static bool UseRange(this string path)
        => path.EndsWith(".mp4", StringComparison.InvariantCultureIgnoreCase) 
        || path.EndsWith(".mp3", StringComparison.InvariantCultureIgnoreCase);

    static ImmutableDictionary<string, CancellationTokenSource> extendedInfosCancellations
        = ImmutableDictionary<string, CancellationTokenSource>.Empty;

    static DirectoryInfo CreateDirectoryInfo(this string path) => new(path);

    static bool IsDirectory(string path)
        => (File.GetAttributes(path) & FileAttributes.Directory) == FileAttributes.Directory;
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
            (info.Attributes & System.IO.FileAttributes.Hidden) == System.IO.FileAttributes.Hidden,
            info.LastWriteTime);

    public static DirectoryItem CreateFileItem(FileInfo info)
        => new(
            info.Name,
            info.Length,
            false,
            Directory.GetIconPath(info),
            (info.Attributes & System.IO.FileAttributes.Hidden) == System.IO.FileAttributes.Hidden,
            info.LastWriteTime);
};

record GetFiles(
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

record GetFilesRequestResult(
    DirectoryItem[] Items,
    string Path,
    int DirCount,
    int FileCount,
    IOErrorType Error
);

static class GetFilesResultExt
{
    public static GetFilesRequestResult FromResult(this GetFilesResult res)
        => new(res.Items, res.Path, res.DirCount, res.FileCount, IOErrorType.NoError);

    public static GetFilesRequestResult ToRequestResult(this Result<GetFilesResult, IOResult> res)
        => res.Match(
            ok => FromResult(ok),
            e => new([], e.Path ?? "", 0, 0, e.Type));
}

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
    RenameItem[] items
);

record DeleteItemsParam(
    string Path,
    string[] Names
);

record CopyItem(
    string Name,
    bool? isDirectory,
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

record ElevatedDriveParam(
    string Path,
    string Name,
    string Password
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
    // TODO eliminate
    NoError,
}

record IOResult(IOErrorType Type, string? Path = null);
static class IOResultExt
{
    public static IOResult AppendPath(this IOResult res, string path)
        => res with { Path = path };
    public static IOResult ToIOResult<T>(this Result<T, IOResult> res)
        where T : notnull
        => res.Match(
            _ => new IOResult(IOErrorType.NoError),
            e => e);
}

static class IOErrorTypeExtensions
{
    public static RequestError ToError(this IOErrorType error)
        => new((int)error, "");
} 

record CopyItemsResult(
    CopyItemInfo[]? Infos,
    IOErrorType? Error = null);

record SpecialKeys(
    bool Alt,
    bool Ctrl,
    bool Shift
);
