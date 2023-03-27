using Microsoft.AspNetCore.Http;

using AspNetExtensions;
using CsTools.Extensions;
using LinqTools;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;

static partial class Directory
{
    public static Task<GetFilesResult> GetFiles(GetFiles getFiles)
    {
        var dirInfo = new DirectoryInfo(getFiles.Path);
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
            var directories = ImageMetadataReader.ReadMetadata(path.AppendPath(file));
            var subIfdDirectory = directories.OfType<ExifSubIfdDirectory>().FirstOrDefault();
            return subIfdDirectory
                    ?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal)
                    .WhiteSpaceToNull()
                    .OrElseWith(() => subIfdDirectory
                                    ?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal))
                    .ToDateTime("yyyy:MM:dd HH:mm:ss");
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
        await context.SendStream(stream, null, path);
    }

    public static Task ProcessMovie(HttpContext context, string path)
        => context.StreamRangeFile(path);

    public static Task<IOResult> CreateFolder(CreateFolderParam input)
        => LinqTools.Core.Try(
            () => System.IO.Directory.CreateDirectory(input.Path.AppendPath(input.Name)).ToNothing(),
            MapExceptionToIOError)
                .ToIOResult();

    public static Task<IOResult> RenameItem(RenameItemParam input)
        => LinqTools.Core.Try(
            () => System.IO.Directory.Move(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName)),
            MapExceptionToIOError)
                .ToIOResult();

    public static Task<IOResult> CopyItems(CopyItemsParam input)
        => LinqTools.Core.Try(
            () => input.items.ForEach(n => CopyItem(n, input.Path, input.TargetPath, input.Move)),
            MapExceptionToIOError)
                .ToIOResult();

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
    bool ShowHiddenItems
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

record DeleteItemsParam(
    string Path,
    string[] Names
);

record CopyItemsParam(
    string Path,
    string TargetPath,
    string[] items,
    bool Move
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