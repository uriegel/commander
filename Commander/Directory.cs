using System.Collections.Concurrent;
using CsTools.Extensions;
using CsTools.Functional;

static partial class Directory
{
    public static GetDirectoryItemsOutput Get(GetFilesInput? getFiles)
    {
        CancelExifs(getFiles?.FolderId ?? "");
        lockers.TryAdd(getFiles?.FolderId ?? "", new(0, 1));
        var dirInfo = new DirectoryInfo(getFiles?.Path ?? "");
        var dirs = dirInfo
                        .GetDirectories()
                        .Select(DirectoryItem.CreateDirItem)
                        .Where(n => getFiles?.ShowHidden == true || !n.IsHidden == true)
                        .OrderBy(n => n.Name)
                        .ToArray();
        var files = dirInfo
                        .GetFiles()
                        .Select(DirectoryItem.CreateFileItem)
                        .Where(n => getFiles?.ShowHidden == true || !n.IsHidden == true)
                        .ToArray();
        if (getFiles?.FolderId != null)
            StartGettingExtendedInfos(getFiles.FolderId, getFiles.RequestId, getFiles?.Path ?? "", files);
        return new([.. dirs, .. files], dirInfo.FullName, dirs.Length, files.Length);
        //   DirectoryWatcher.Initialize(getFiles.FolderId, getFiles.Path);
    }

    public static void GetItemsFinished(string folderId)
    {
        if (lockers.TryGetValue(folderId, out var locker))
            locker.Release();
    }

    public static Task CopyAsync(CopyInput input) => BackgroundJobs.AddJobAsync(input);

    public static FlatCopyItem[] FlattenItems(FlattenItemsInput input)
    {
        return [
            .. input.Items.FlattenTree(Resolver, CreateCopyItemInfo, IsDirectory, new CancellationTokenSource(TimeSpan.FromSeconds(10)).Token, AppendSubPath, (string?)null)
        ];

        (IEnumerable<CopyItem>, string) Resolver(CopyItem item, string? subPath)
            => (GetCopyItems(subPath.AppendPath(item.Name)), item.Name);


        IEnumerable<CopyItem> GetCopyItems(string subPath)
        {
            var info = new DirectoryInfo(input.Path.AppendPath(subPath));
            var dirInfos = info
                            .GetDirectories()
                            .Select(n => new CopyItem(n.Name, true, null, null, 0, null, null));
            var fileInfos = info
                                .GetFiles()
                                .Select(n => new CopyItem(n.Name, false, null, n.LastWriteTime, n.Length, null, null));
            return fileInfos.Concat(dirInfos);
        }

        FlatCopyItem CreateCopyItemInfo(CopyItem copyItem, string? subPath)
        {
            var targetFile = input.TargetPath.AppendPath(subPath).AppendPath(copyItem.Name);
            var fi = new FileInfo(targetFile);
            return new FlatCopyItem(
                subPath.AppendPath(copyItem.Name),
                GetIconPath(copyItem.Name, null),
                copyItem.Time,
                copyItem.Size,
                fi.Exists ? fi.LastWriteTime : null,
                fi.Exists ? fi.Length : null);
        }

        static bool IsDirectory(CopyItem item, string? subPath) => item.IsDirectory == true;

        static string AppendSubPath(string? initialPath, string? subPath) => initialPath.AppendPath(subPath);
    }

    static void CancelExifs(string folderId)
    {
        if (extendedItemsDatas.TryRemove(folderId, out var data))
            data.Cancellation.Cancel();
        lockers.TryRemove(folderId, out var locker);
        Requests.SendJson(new(folderId, EventCmd.ExtendedInfosStop, new EventData { RequestId = 0 }));
    }

    static void StartGettingExtendedInfos(string folderId, int requestId, string path, DirectoryItem[] items)
    {
        var cancellation = new CancellationTokenSource();
        if (lockers.TryGetValue(folderId, out var locker))
        {
            var task = RetrieveExtendedInfos(folderId, requestId, path, items, locker, cancellation.Token);
            var data = new ExtendedItemsData(task, cancellation);
            extendedItemsDatas.AddOrUpdate(folderId, data, (_, v) =>
            {
                v.Cancellation.Cancel();
                return data;
            });
        }
    }

    static async Task RetrieveExtendedInfos(string folderId, int requestId, string path, DirectoryItem[] items, SemaphoreSlim locker, CancellationToken cancellation)
    {
        await locker.WaitAsync(cancellation);

        var checkItems = items
                            .SelectFilterNull(n => n.Idx.HasValue ? n : null)
                            .Where(FilterExifItems);
        if (!checkItems.Any())
            return;

        Requests.SendJson(new(folderId, EventCmd.ExtendedInfosStart, new EventData { RequestId = requestId }));
        var exifItems = checkItems
                            .Where(_ => !cancellation.IsCancellationRequested)
                            .SelectFilterNull(n =>
                            {
                                var exif = ExifReader.GetExifData(path.AppendPath(n.Name));
                                return exif != null ? new ExifData(n.Idx ?? -1, exif.DateTime, exif?.Latitude, exif?.Longitude) : null;
                            })
                            .ToArray();
        var versionItems = FileVersion.GetVersionItems(path, items, cancellation);

        if (!cancellation.IsCancellationRequested)
            Requests.SendJson(new(folderId, EventCmd.ExtendedInfos, new EventData { RequestId = requestId, Exifs = exifItems, Versions = versionItems }));
        Requests.SendJson(new(folderId, EventCmd.ExtendedInfosStop, new EventData { RequestId = requestId }));
    }

    static bool FilterExifItems(DirectoryItem item)
    => item.Name.EndsWith("jpg", StringComparison.OrdinalIgnoreCase)
        || item.Name.EndsWith("jpeg", StringComparison.OrdinalIgnoreCase)
        || item.Name.EndsWith("jpg", StringComparison.OrdinalIgnoreCase)
        || item.Name.EndsWith("png", StringComparison.OrdinalIgnoreCase);


    static readonly ConcurrentDictionary<string, ExtendedItemsData> extendedItemsDatas = [];
    static readonly ConcurrentDictionary<string, SemaphoreSlim> lockers = [];
}

record ExtendedItemsData(Task Task, CancellationTokenSource Cancellation);

    
//     public static async Task ProcessFile(HttpContext context, string path)
//     {
//         using var stream = path.OpenFile();
//         await (path.UseRange()
//             ? context.StreamRangeFile(path)
//             : context.SendStream(stream, null, path));
//     }

//     public static void FilesDropped(string id, bool move, string[] paths)
//         => Events.FilesDropped(new FilesDrop(
//             id,
//             move,
//             new DirectoryInfo(paths[0]).Parent?.FullName ?? "",
//             paths
//                 .Select(n => IsDirectory(n)
//                             ? DirectoryItem.CreateDirItem(new DirectoryInfo(n))
//                             : DirectoryItem.CreateFileItem(new FileInfo(n)))
//                 .ToArray()));

//     public static AsyncResult<Nothing, RequestError> RenameItems(RenameItemsParam input)
//     {
//         var res = input.Items.Aggregate(Ok<Nothing, RequestError>(nothing), (r, i) => r.SelectMany(_ => PreRenameItem(i)));
//         res = input.Items.Aggregate(res, (r, i) => r.SelectMany(_ => RenameItem(i)));
//         return res.ToAsyncResult();

//         Result<Nothing, RequestError> PreRenameItem(RenameItem item)
//             => Move(input.Path.AppendPath(item.Name), input.Path.AppendPath("__RENAMING__" + item.NewName));
//         Result<Nothing, RequestError> RenameItem(RenameItem item)
//             => Move(input.Path.AppendPath("__RENAMING__" + item.NewName), input.Path.AppendPath(item.NewName));
//     }

//     public static AsyncResult<Nothing, RequestError> RenameAsCopy(RenameItemParam input)
//         => Try(
//             () => nothing
//                     .SideEffect(_ => File.Copy(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName))),
//             MapExceptionToRequestError)
//                 .ToAsyncResult();

//     public static AsyncResult<Nothing, RequestError> OnEnter(OnEnterParam input)
//         => Ok<Nothing, RequestError>(nothing)
//             .SideEffect(_ => OnEnter(input.Path, input.Keys))
//             .ToAsyncResult();

//     public static bool IsDirectory(string path)
//         => (File.GetAttributes(path) & FileAttributes.Directory) == FileAttributes.Directory;

//     public static void SaveDelete(this string path)
//     {
//         try 
//         {
//              File.Delete(path);
//         }
//         catch {}
//     }
        
//     public static RequestError ErrorToRequestError(DirectoryError de)
//         => de switch
//         {
//             DirectoryError.AccessDenied      => IOErrorType.AccessDenied.ToError(),
//             DirectoryError.DirectoryNotFound => IOErrorType.PathNotFound.ToError(),
//             DirectoryError.NotSupported      => IOErrorType.NotSupported.ToError(),
//             DirectoryError.PathTooLong       => IOErrorType.PathTooLong.ToError(),
//             _                                => IOErrorType.Exn.ToError()
//         };
       
//     static RequestError MapExceptionToRequestError(Exception e)
//         => e switch
//         {
//             IOException ioe when ioe.HResult == 13 => IOErrorType.AccessDenied.ToError(),
//             IOException ioe when ioe.HResult == -2147024891 => IOErrorType.AccessDenied.ToError(),
//             UnauthorizedAccessException => IOErrorType.AccessDenied.ToError(),
//             _ => IOErrorType.Exn.ToError()
//         };


//     static bool UseRange(this string path)
//         => path.EndsWith(".mp4", StringComparison.InvariantCultureIgnoreCase) 
//         || path.EndsWith(".mp3", StringComparison.InvariantCultureIgnoreCase);

//     static ImmutableDictionary<string, CancellationTokenSource> extendedInfosCancellations
//         = ImmutableDictionary<string, CancellationTokenSource>.Empty;
// }

// static class IOErrorTypeExtensions
// {
//     public static RequestError ToError(this IOErrorType error)
//         => new((int)error, error switch 
//                                 {
//                                     IOErrorType.AccessDenied => "Access denied",
//                                     IOErrorType.AlreadyExists => "Already exists",
//                                     IOErrorType.FileNotFound => "File not found",
//                                     IOErrorType.DeleteToTrashNotPossible => "Delete to trash not possible",
//                                     IOErrorType.Exn => "Exception",
//                                     IOErrorType.NetNameNotFound => "Net name not found",
//                                     IOErrorType.PathNotFound => "Path not found",
//                                     IOErrorType.NotSupported => "Not supported",
//                                     IOErrorType.PathTooLong => "Path too long",
//                                     IOErrorType.Canceled => "Canceled",
//                                     IOErrorType.WrongCredentials => "Wrong credentials",
//                                     IOErrorType.OperationInProgress => "Operation in Progress",
//                                     _ => "Unknown"
//                                 });
// } 
