using System.Collections.Concurrent;
using System.Security.Cryptography.X509Certificates;
using CsTools.Extensions;
using CsTools.Functional;

partial class Directory(string folderId) : IDisposable
{
    public string FolderId { get => folderId; }   
    public static Directory Get(string? id) => directories.TryGetValue(id!, out var result) ? result : throw new ArgumentNullException();

    public static GetDirectoryItemsOutput GetFiles(GetFilesInput input)
    {
        var dir = new Directory(input.FolderId);
        directories.AddOrUpdate(input.FolderId, dir, (_, old) =>
        {
            old.Dispose();
            return dir;
        });
        return dir.Get(input);
    }
        
    public void GetItemsFinished(string folderId) =>locker?.Release();

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

    public static void ExtendedRename(ExtendedRenameInput input)
    {
        foreach (var item in input.Items)
            System.IO.Directory.Move(input.Path.AppendPath(item.Name), input.Path.AppendPath("__RENAMING__" + item.NewName));
        foreach (var item in input.Items)
            System.IO.Directory.Move(input.Path.AppendPath("__RENAMING__" + item.NewName), input.Path.AppendPath(item.NewName));
    }

    public static DirectoryItem[] ExtendCopyItems(string[] items)
        => [.. items.Select(n => File.Exists(n)
                ? DirectoryItem.CreateFileItem(new FileInfo(n), -1)
                : DirectoryItem.CreateDirItem(new DirectoryInfo(n), -1))];

    public int GetIndex(string? fileName)
        => itemsByName.TryGetValue(fileName ?? "", out var item) ? item.Idx : -1;

    public void Rename(int index, string newName)
    {
        if (itemsByIndex.TryGetValue(index, out var oldItem))
        {
            var item = itemsByIndex.AddOrUpdate(index, new DirectoryItem("", -1), (k, v) =>  v with { Name = newName});
            itemsByName.TryRemove(oldItem.Name, out var _);
            itemsByName.AddOrUpdate(newName, item, (_, __) => item);
        }
    }

    GetDirectoryItemsOutput Get(GetFilesInput getFiles)
    {
        try 
        {
            locker = new(0, 1);
            var dirInfo = new DirectoryInfo(getFiles.Path);
            var dirs = dirInfo
                            .GetDirectories()
                            .Select(n => DirectoryItem.CreateDirItem(n , ++idxSeed))
                            .Where(n => getFiles.ShowHidden == true || !n.IsHidden == true)
                            .OrderBy(n => n.Name)
                            .ToArray();
            var files = dirInfo
                            .GetFiles()
                            .Select(n => DirectoryItem.CreateFileItem(n, ++idxSeed))
                            .Where(n => getFiles.ShowHidden == true || !n.IsHidden == true)
                            .ToArray();
            if (getFiles?.FolderId != null)
            {
                StartGettingExtendedInfos(getFiles.FolderId, getFiles.RequestId, getFiles.Path, files);
                ObjectDisposedException.ThrowIf(disposedValue, this);
                directoryWatcher?.Dispose();
                directoryWatcher = new(getFiles.Path,this);
            }
            DirectoryItem[] items = [.. dirs, .. files];
            idxSeed = items.Length;
            itemsByIndex = new(items.ToDictionary(n => n.Idx));
            itemsByName = new(items.ToDictionary(n => n.Name, n => n));
            return new(items, dirInfo.FullName, dirs.Length, files.Length);
        }
        catch (UnauthorizedAccessException)
        {
            CheckGetFilesAccessException(getFiles.Path);
            throw;
        }
    }

    void CancelExifs(string folderId)
    {
        extendedItemsData?.Cancellation.Cancel();
        extendedItemsData = null;
        Requests.SendJson(new(folderId, EventCmd.ExtendedInfosStop, new EventData { RequestId = 0 }));
    }

    void StartGettingExtendedInfos(string folderId, int requestId, string path, DirectoryItem[] items)
    {
        var cancellation = new CancellationTokenSource();
        if (locker != null)
        {
            var task = RetrieveExtendedInfos(folderId, requestId, path, items, locker, cancellation.Token);
            var data = new ExtendedItemsData(task, cancellation);
            extendedItemsData?.Cancellation.Cancel();
            extendedItemsData = data;
        }
    }

    static async Task RetrieveExtendedInfos(string folderId, int requestId, string path, DirectoryItem[] items, SemaphoreSlim locker, CancellationToken cancellation)
    {
        await locker.WaitAsync(cancellation);

        var checkItems = items.Where(FilterExifItems);
        if (!checkItems.Any())
            return;

        Requests.SendJson(new(folderId, EventCmd.ExtendedInfosStart, new EventData { RequestId = requestId }));
        var exifItems = checkItems
                            .Where(_ => !cancellation.IsCancellationRequested)
                            .SelectFilterNull(n =>
                            {
                                var exif = ExifReader.GetExifData(path.AppendPath(n.Name));
                                return exif != null ? new ExifData(n.Idx, exif.DateTime, exif?.Latitude, exif?.Longitude) : null;
                            })
                            .ToArray();
        var versionItems = FileVersion.GetVersionItems(path, items, cancellation);

        if (!cancellation.IsCancellationRequested)
            Requests.SendJson(new(folderId, EventCmd.ExtendedInfos, new EventData { RequestId = requestId, Exifs = exifItems, Versions = versionItems }));
        Requests.SendJson(new(folderId, EventCmd.ExtendedInfosStop, new EventData { RequestId = requestId }));
    }

    static readonly ConcurrentDictionary<string, Directory> directories = [];

    ConcurrentDictionary<int, DirectoryItem> itemsByIndex = [];      
    ConcurrentDictionary<string, DirectoryItem> itemsByName = [];      
    DirectoryWatcher? directoryWatcher;
    ExtendedItemsData? extendedItemsData;
    SemaphoreSlim? locker;
    int idxSeed;

    #region IDisposable

    protected virtual void Dispose(bool disposing)
    {
        if (!disposedValue)
        {
            if (disposing)
            {
                CancelExifs(folderId);
                directoryWatcher?.Dispose();
                extendedItemsData?.Cancellation.Cancel();
            }

            // TODO: Nicht verwaltete Ressourcen (nicht verwaltete Objekte) freigeben und Finalizer überschreiben
            // TODO: Große Felder auf NULL setzen
            disposedValue = true;
        }
    }

    // // TODO: Finalizer nur überschreiben, wenn "Dispose(bool disposing)" Code für die Freigabe nicht verwalteter Ressourcen enthält
    // ~Directory()
    // {
    //     // Ändern Sie diesen Code nicht. Fügen Sie Bereinigungscode in der Methode "Dispose(bool disposing)" ein.
    //     Dispose(disposing: false);
    // }

    public void Dispose()
    {
        // Ändern Sie diesen Code nicht. Fügen Sie Bereinigungscode in der Methode "Dispose(bool disposing)" ein.
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    bool disposedValue;

    #endregion
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

//     public static AsyncResult<Nothing, RequestError> RenameAsCopy(RenameItemParam input)
//         => Try(
//             () => nothing
//                     .SideEffect(_ => File.Copy(input.Path.AppendPath(input.Name), input.Path.AppendPath(input.NewName))),
//             MapExceptionToRequestError)
//                 .ToAsyncResult();

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
