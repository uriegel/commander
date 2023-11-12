using System.Data;
using System.Collections.Immutable;
using Microsoft.AspNetCore.Http;

using AspNetExtensions;
using CsTools;
using CsTools.Extensions;
using LinqTools;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;

using static LinqTools.Core;
using static System.IO.Directory;

using static CsTools.Functional.Tree;

static partial class Directory
{
    public static Task<GetFilesResult> GetFiles(GetFiles getFiles)
        => getFiles.Path
                .If(getFiles.Mount == true,
                    Mount)
                .CreateDirectoryInfo()
                .Validate()
                .SelectMany(n => GetFiles(n, getFiles.ShowHiddenItems))
                .Get(e => GetFilesResult.CreateError(e, getFiles.Path))
                .ToAsync();

    public static GetExtendedItemsResult GetExtendedItems(string id, string path, string[] items)
    {
        extendedInfosCancellations = extendedInfosCancellations.Remove(id);
        extendedInfosCancellations = extendedInfosCancellations.Add(id, new());
        DateTime? GetExifDate(string file)
        {
            if (extendedInfosCancellations
                        .GetValue(id)
                        .Select(n => n.IsCancellationRequested)
                        .GetOrDefault(false))
                return null;
            try
            {
                var directories = ImageMetadataReader.ReadMetadata(path.AppendPath(file));
                var subIfdDirectory = directories.OfType<ExifSubIfdDirectory>().FirstOrDefault();
                return (subIfdDirectory
                        ?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal)
                        .WhiteSpaceToNull())
                        .FromNullable()
                        .Or(() =>
                            (subIfdDirectory
                                        ?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal)
                                        .WhiteSpaceToNull())
                        .FromNullable())
                            .GetOrDefault("")
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
                .ToIOResult();

    public static Task<IOResult> RenameItem(RenameItemParam input)
        => Try(
            () => Move(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName)),
            MapExceptionToIOError)
                .ToIOResult();

    public static Task<IOResult> CancelExtendedItems(CancelExtendedItems cancelExtendedItems)
    {
        extendedInfosCancellations.GetValue(cancelExtendedItems.Id).WhenSome(n => n.Cancel());
        return Task.FromResult(new IOResult(IOError.NoError));
    }

    public static Task<CopyItemsResult> CopyItemsInfo(CopyItemsParam input)
    {
        return CopyItemsInfo()
                .Catch(MapExceptionToCopyItems);

        async Task<CopyItemsResult> CopyItemsInfo()
            => await new CopyItemsResult(input.Items.FlattenTree(Resolver, CreateCopyItemInfo, IsDirectory, new CancellationTokenSource(TimeSpan.FromSeconds(10)).Token,
                        AppendSubPath, (string?)null).ToArray(), null)
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
    }

    public static void FilesDropped(string id, string[] paths)
        => Events.FilesDropped(new FilesDrop(
            id,
            new DirectoryInfo(paths[0]).Parent?.FullName ?? "",
            paths
                .Select(n => IsDirectory(n)
                            ? DirectoryItem.CreateDirItem(new DirectoryInfo(n))
                            : DirectoryItem.CreateFileItem(new FileInfo(n)))
                .ToArray()));

    public static Task<IOResult> CopyItems(CopyItemsParam input)
        => CopyItems(input, input.Items)
            .Catch(MapExceptionToIOResult);

    public static Task<IOResult> CancelCopy(Empty _)
        => Task.FromResult(new IOResult(null)
                                .SideEffect(Cancellation.Cancel));

    public static Task<IOResult> RenameItems(RenameItemsParam input)
    {
        return Try(
            () => {
                input.items.ForEach(PreRenameItem);
                input.items.ForEach(RenameItem);
            },
            MapExceptionToIOError)
                .ToIOResult();
        void PreRenameItem(RenameItem item)
            => Move(input.Path.AppendPath(item.Name), input.Path.AppendPath("__RENAMING__" + item.NewName));
        void RenameItem(RenameItem item)
            => Move(input.Path.AppendPath("__RENAMING__" + item.NewName), input.Path.AppendPath(item.NewName));
    }

    public static Task<IOResult> RenameAndCopy(RenameItemParam input)
        => Try(
            () => File.Copy(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName)),
            MapExceptionToIOError)
                .ToIOResult();

    public static Task<IOResult> OnEnter(OnEnterParam input)
        => new IOResult(null)
            .SideEffect(_ => OnEnter(input.Path, input.Keys))
            .ToAsync();

    public static Result<GetFilesResult, IOError> GetFiles(DirectoryInfo dirInfo, bool showHiddenItems)
    {
        return
             Try(
                () => new DirFileInfo(
                    dirInfo
                        .GetDirectories()
                        .Select(DirectoryItem.CreateDirItem)
                        .Where(FilterHidden)
                        .OrderBy(n => n.Name)
                        .ToArray(),
                    dirInfo
                        .GetFiles()
                        .Select(DirectoryItem.CreateFileItem)
                        .Where(FilterHidden)
                        .ToArray()),
                e => IOError.PathNotFound)
            .Select(MakeFilesResult);

        GetFilesResult MakeFilesResult(DirFileInfo dirFileInfo)
            => new (dirFileInfo.Directories.Concat(dirFileInfo.Files).ToArray(),
                    dirInfo.FullName,
                    dirFileInfo.Directories.Length,
                    dirFileInfo.Files.Length,
                    IOError.NoError);

        bool FilterHidden(DirectoryItem item)
            => showHiddenItems || !item.IsHidden;
    }

    static bool UseRange(this string path)
        => path.EndsWith(".mp4", StringComparison.InvariantCultureIgnoreCase) 
        || path.EndsWith(".mp3", StringComparison.InvariantCultureIgnoreCase);

    static async Task<IOResult> CopyItems(CopyItemsParam input, CopyItem[] items)
        => await CopyItems(items.Length, 
                            items
                            .Select(n => n.Size)
                            .Aggregate(0L, (a, b) => a + b), 
                        input, new HashSet<string>(), Cancellation.Create());

    static Task<IOResult> CopyItems(int totalCount, long totalSize, CopyItemsParam input,
        HashSet<string> newDirs, CancellationToken cancellationToken)
        => input
            .Items
            .Aggregate(new FileCopyAggregateItem(0L, 0, DateTime.Now), (fcai, n) =>
            {
                if (cancellationToken.IsCancellationRequested)
                    return new(0, 0, DateTime.Now);
                var targetPath = input.TargetPath.AppendPath(n.SubPath);
                EnsurePathExists(input.TargetPath, n.SubPath, newDirs);
                CopyItem(n.Name, input.Path.AppendPath(n.SubPath), targetPath,
                    (c, t) => Events.CopyProgressChanged(
                        new(n.Name, totalCount, fcai.Count + 1, (int)(DateTime.Now - fcai.StartTime).TotalSeconds, t, c, totalSize, fcai.Bytes + c)),
                    input.Move, cancellationToken);
                return new(fcai.Bytes + n.Size, fcai.Count + 1, fcai.StartTime);
            })
            .SideEffect(n =>
            {
                if (input.Move)
                    foreach (var dir in newDirs)
                    {
                        try
                        {
                            Delete(input.Path.AppendPath(dir));
                        }
                        catch { }
                    };
            })
            .ToIOResult();

    static void EnsurePathExists(string path, string? subPath, HashSet<string> dirs)
    {
        if (subPath != null&& !dirs.Contains(subPath))
        {
            var targetPath = path.AppendPath(subPath);
            if (!System.IO.Directory.Exists(targetPath))
                System.IO.Directory.CreateDirectory(targetPath);
            dirs.Add(subPath);
        }
    }   

    static Task<IOResult> ToIOResult<T>(this T t)
        => new IOResult(null).ToAsync();

    static Task<IOResult> ToIOResult(this Result<Nothing, IOError> result)
        => result.Match(
                _ => (IOError?)null,
                e => e 
            ).ToTask();

    static IOResult MapExceptionToIOResult(Exception e)
        => new(MapExceptionToIOError(e));

    static CopyItemsResult MapExceptionToCopyItems(Exception e)
        => new(null, MapExceptionToIOError(e));

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
    int FileCount,
    IOError Error
) {
    public static GetFilesResult CreateError(IOError e, string path)
        => new(Array.Empty<DirectoryItem>(), path, 0, 0, e); 
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

enum IOError {
    NoError,
    AccessDenied,
    AlreadyExists,
    FileNotFound,
    DeleteToTrashNotPossible,
    Exn,
    NetNameNotFound,
    PathNotFound
}

record IOResult(IOError? Error);

static class IOResultExtensions
{
    public static Task<IOResult> ToTask(this IOError? ioError)
        => (new IOResult(ioError)).ToAsync();
}

record CopyItemsResult(
    CopyItemInfo[]? Infos,
    IOError? Error
);

record SpecialKeys(
    bool Alt,
    bool Ctrl,
    bool Shift
);
