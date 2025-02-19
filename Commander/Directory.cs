using System.Collections.Concurrent;
using System.Data;
using CsTools;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using GtkDotNet;
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
        =>Try(
            () => GetFilesResult(dirInfo, showHiddenItems),
            e => IOErrorType.PathNotFound.ToError());

    public static GetFilesResult GetFilesResult(DirectoryInfo dirInfo, bool showHiddenItems)
    {
        return MakeFilesResult(new DirFileInfo(
                    [.. dirInfo
                        .GetDirectories()
                        .Select(DirectoryItem.CreateDirItem)
                        .Where(FilterHidden)
                        .OrderBy(n => n.Name)],
                    dirInfo
                        .GetFiles()
                        .Select(DirectoryItem.CreateFileItem)
                        .Where(FilterHidden)
                        .ToArray()));

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

    public static async Task<bool> ProcessFile(IRequest request)
    {
        try
        {
            var filepath = request.QueryParts.GetValue("path")?.ReplacePathSeparatorForPlatform();
            if (filepath != null)
            {
                using var file = File.OpenRead(filepath);
                var ext = filepath?.GetFileExtension()?.ToLowerInvariant() ?? ".txt";
                var mime = ext == ".png" || ext == ".jpg" || ext == ".pdf" || ext == ".mp4" || ext == ".mkv" || ext == ".mp3"
                    ? MimeType.Get(ext)!
                    : MimeTypes.TextPlain;
                if (mime != MimeTypes.TextPlain || !file.IsBinary())
                    await request.SendAsync(file, file.Length, mime == MimeTypes.TextPlain ? MimeTypes.TextPlain + "; charset=utf-8" : mime);
                else
                    await request.Send404();

                return true;
            }
            else
                return false;
        }
        catch
        {
            return false;
        }
    }

    public static Result<CopyItemResult, RequestError> CheckCopyItems(CheckCopyItems input)
    {


        // 4 Items to copy. 2 deleted
        // copyItems
        // Object

        // conflicts: Array (2)
        // 0
        // {name: "Bildschirmfoto vom 2024-12-16 13-34-52.png", iconPath: ".png", size: 75576, time: "2024-12-16T12:34:52.997Z", targetSize: 75576, …}
        // 1
        // {name: "Bildschirmfoto vom 2024-12-19 11-39-51.png", iconPath: ".png", size: 24048, time: "2024-12-19T10:39:51.231845639Z", targetSize: 24048, …}

        // Array Prototype

        // items: Array (2)
        // 0
        // {name: "Bildschirmfoto vom 2024-12-16 13-34-52.png", size: 75576, isDirectory: false, iconPath: ".png", isHidden: false, …}
        // 1
        // {name: "Bildschirmfoto vom 2024-12-19 11-39-51.png", size: 24048, isDirectory: false, iconPath: ".png", isHidden: false, …}




        var conflictItems =
            FlattenDirectories(input.Items)
            .Select(n => CreateCopyItem(n, input.Path, input.TargetPath))
            .SelectFilterNull(n => n.Item1 != null ? n : null)
            .ToArray();


        (DirectoryItem?, ConflictItem?) CreateCopyItem(DirectoryItem item, string path, string targetPath)
        {
            var updatedItem = Try(
                () => DirectoryItem.CreateFileItem(new FileInfo(path.AppendPath(item.Name))) with { Name = item.Name },
                e => IOErrorType.PathNotFound.ToError())
                    .ToNullable();
            var conflict = Try(
                () => DirectoryItem.CreateFileItem(new FileInfo(targetPath.AppendPath(item.Name))) with { Name = item.Name },
                e => IOErrorType.PathNotFound.ToError())
                    .ToNullable();
            return (updatedItem, updatedItem != null && conflict != null ? ConflictItem.Create(updatedItem, conflict) : null);
        }


        return Error<CopyItemResult, RequestError>(new RequestError(245, "Nein"));

        IEnumerable<DirectoryItem> FlattenDirectories(IEnumerable<DirectoryItem> items)
        {
            var files = items.Where(n => !n.IsDirectory);
            var subFiles = items.Where(n => n.IsDirectory).SelectMany(n => UnpackDirectory(input.Path, n.Name));
            return files.Concat(subFiles);
        }
            
        IEnumerable<DirectoryItem> UnpackDirectory(string path, string subPath)
            => path
                .AppendPath(subPath)
                .CreateDirectoryInfo()
                .Pipe(n => FlattenDirectories(GetFilesResult(n, true).Items.Select(n =>

{
    var affe = n with { Name = subPath.AppendPath(n.Name) };
    Console.WriteLine($"Affe: {affe}");
    return affe;
}
                )));
    }

    public static Result<Nothing, RequestError> CreateFolder(CreateFolderInput input)
        => Try(
            () => nothing.SideEffect(_ => System.IO.Directory.CreateDirectory(input.Path.AppendPath(input.Name))),
            Error.MapException);

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
record CreateFolderInput(string Path, string Name);
record DeleteItemsParam(string Path, string[] Names);
record CheckCopyItems(string Path, string TargetPath, DirectoryItem[] Items);
record ConflictItem(string Name, string? IconPath, long Size, DateTime? Time, long TargetSize, DateTime? TargetTime)
{
    public static ConflictItem Create(DirectoryItem item, DirectoryItem source)
        => new(item.Name, item.IconPath, source.Size, source.Time, item.Size, item.Time);
};
record CopyItemResult(DirectoryItem[] Items, ConflictItem[] Conflicts);


// TODO 
static class Extensions2
{
    public static string ReplacePathSeparatorForPlatform(this string path)
#if Windows
        => path.Replace('/', '\\');
#else
        => path;
#endif

    public static bool IsBinary(this Stream file)
    {
        file.Position = 0;
        try
        {
            const int charsToCheck = 8000;
            const char nulChar = '\0';
            var requiredConsecutiveNull = 1;

            int nulCount = 0;

            using var streamReader = new StreamReader(file, leaveOpen: true);
            for (var i = 0; i < charsToCheck; i++)
            {
                if (streamReader.EndOfStream)
                    return false;

                if ((char)streamReader.Read() == nulChar)
                {
                    nulCount++;

                    if (nulCount >= requiredConsecutiveNull)
                        return true;
                }
                else
                    nulCount = 0;
            }
            return false;
        }
        finally
        {
            file.Position = 0;
        }
    }

    public static T? ToNullable<T, TE>(this Result<T, TE> result)
        where T : notnull
        where TE : notnull
    {
#nullable disable
        return result.Match(n => n, e => default);
#nullable enable
    }         
}
