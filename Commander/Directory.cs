using Microsoft.AspNetCore.Http;

using AspNetExtensions;
using CsTools;
using CsTools.Extensions;
using LinqTools;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;

using static LinqTools.Core;
using static System.IO.Directory;
using System.Data;

static partial class Directory
{
    public static Task<GetFilesResult> GetFiles(GetFiles getFiles)
    {
        var path = getFiles.Path;
        if (getFiles.Mount == true)
            path = Mount(getFiles.Path);
        var dirInfo = new DirectoryInfo(path);
        var dirs =
            dirInfo
                .GetDirectories()
                .Select(CreateDirItem)
                .Where(FilterHidden)
                .OrderBy(n => n.Name)
                .ToArray();

        var files =
            dirInfo
                .GetFiles()
                .Select(CreateFileItem)
                .Where(FilterHidden)
                .ToArray();

        return new GetFilesResult(dirs.Concat(files).ToArray(),
            dirInfo.FullName,
            dirs.Length,
            files.Length)
                .ToAsync();

        DirectoryItem CreateDirItem(DirectoryInfo info)
            => new(
                info.Name,
                0,
                true,
                null,
                (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden,
                info.LastWriteTime);

        DirectoryItem CreateFileItem(FileInfo info)
            => new(
                info.Name,
                info.Length,
                false,
                GetIconPath(info),
                (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden,
                info.LastWriteTime);

        bool FilterHidden(DirectoryItem item)
            => getFiles.ShowHiddenItems || !item.IsHidden;
    }

    public static GetExtendedItemsResult GetExtendedItems(string path, string[] items)
    {
        DateTime? GetExifDate(string file)
        {
            try
            {
                var directories = ImageMetadataReader.ReadMetadata(path.AppendPath(file));
                var subIfdDirectory = directories.OfType<ExifSubIfdDirectory>().FirstOrDefault();
                return
                    (subIfdDirectory
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

    public static Task<CopyItemsResult> CopyItemsInfo(CopyItemsParam input)
        => CopyItemsInfo(input.Path, input.TargetPath, null, 
                new List<CopyItemInfo>(), input.Items, (new CancellationTokenSource(TimeSpan.FromSeconds(10))).Token)
            .Catch(MapExceptionToCopyItems);

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

    static bool UseRange(this string path)
        => path.EndsWith(".mp4", StringComparison.InvariantCultureIgnoreCase) 
        || path.EndsWith(".mp3", StringComparison.InvariantCultureIgnoreCase);

    static async Task<CopyItemsResult> CopyItemsInfo(string path, string targetPath, string? subPath, 
            List<CopyItemInfo> recentInfos, CopyItem[] items, CancellationToken cancellation)
        => await (new CopyItemsResult(
                items
                    .Aggregate(recentInfos, (infos, item) => AddCopyItemInfo(path, targetPath, subPath, infos, item, cancellation))
                    .ToArray(), 
                null))
                    .ToAsync();

    static List<CopyItemInfo> AddCopyItemInfo(string path, string targetPath, string? subPath,
            List<CopyItemInfo> recentInfos, CopyItem copyItem, CancellationToken cancellation)
        => copyItem.isDirectory == true
        ? GetCopyItems(AppendPath(path, subPath).AppendPath(copyItem.Name))
            .Aggregate(recentInfos, (infos, item) => AddCopyItemInfo(path, targetPath, subPath?.AppendPath(copyItem.Name) ?? copyItem.Name,
                                                                        infos, item, cancellation))
        : recentInfos.SideEffect(l => l.Add(CreateCopyItemInfo(copyItem, subPath, targetPath, cancellation)));

    static CopyItemInfo CreateCopyItemInfo(CopyItem copyItem, string? subPath, string targetPath, CancellationToken cancellation) 
    {
        cancellation.ThrowIfCancellationRequested();
        var targetFile = AppendPath(targetPath, subPath).AppendPath(copyItem.Name);
        var fi = new FileInfo(targetFile);
        return new CopyItemInfo(
            copyItem.Name, 
            subPath ?? "", 
            copyItem.Size, 
            copyItem.Time, 
            fi.Exists ? fi.Length : null, 
            fi.Exists ? fi.LastWriteTime : null);
    }

    static IEnumerable<CopyItem> GetCopyItems(string directory)
    {
        var info = new DirectoryInfo(directory);
        var dirInfos = info
                        .GetDirectories()
                        .Select(n => new CopyItem(n.Name, true, 0, DateTime.MinValue, null));
        var fileInfos = info
                            .GetFiles()
                            .Select(n => new CopyItem(n.Name, false, n.Length, n.LastWriteTime, null));
        return dirInfos.Concat(fileInfos);
    }

    static async Task<IOResult> CopyItems(CopyItemsParam input, CopyItem[] items)
        => await CopyItems(items.Length, items
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
                var targetPath = AppendPath(input.TargetPath, n.SubPath);
                EnsurePathExists(input.TargetPath, n.SubPath, newDirs);
                CopyItem(n.Name, AppendPath(input.Path, n.SubPath), targetPath,
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
            var targetPath = AppendPath(path, subPath);
            if (!System.IO.Directory.Exists(targetPath))
                System.IO.Directory.CreateDirectory(targetPath);
            dirs.Add(subPath);
        }
    }   

    static string AppendPath(string path, string? subPath)
        => subPath != null ? path.AppendPath(subPath) : path;

    static Task<IOResult> ToIOResult<T>(this T t)
        => (new IOResult(null)).ToAsync();

    static Task<IOResult> ToIOResult(this Result<Nothing, IOError> result)
        => result.Match(
                _ => (IOError?)null,
                e => e 
            ).ToTask();

    static async Task<IOResult> ToIOResult(this Task<Result<Nothing, IOError>> result)
        => new IOResult(
            await result.MatchAsync(
                _ => (IOError?)null,
                e => e
            ));

    static IOResult MapExceptionToIOResult(Exception e)
        => new(MapExceptionToIOError(e));

    static CopyItemsResult MapExceptionToCopyItems(Exception e)
        => new CopyItemsResult(null, MapExceptionToIOError(e));
}

record DirectoryItem(
    string Name,
    long Size,
    bool IsDirectory,
    string? IconPath,
    bool IsHidden,
    DateTime Time
);

record GetFiles(
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

record GetExtendedItems(
    string[] Items,
    string Path
);

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

enum IOError {
    NoError,
    AccessDenied,
    AlreadyExists,
    FileNotFound,
    DeleteToTrashNotPossible,
    Exn
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
