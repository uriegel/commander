using System.Collections.Concurrent;
using System.Reactive.Linq;
using System.Reactive.Subjects;
using CsTools.Extensions;

class DirectoryWatcher : IDisposable
{
    public enum JobType
    {
        Created,
        Deleted,
        Changed,
        Renamed
    }

    public DirectoryWatcher(string path, Directory directory)
    {
        Directory = directory;
        fsw = CreateWatcher(path);
        fsw.Created += Created;
        fsw.Deleted += Deleted;
        fsw.Changed += Changed;
        fsw.Renamed += Renamed;
    }

    Directory Directory { get; }

    void Created(object _, FileSystemEventArgs e)
    {
        if (Directory.GetIndex(e.Name) != -1)
            return;
        var item = Directory.Create(e.FullPath);
        if (item == null)
            return;
        Process(() => new(JobType.Created, Directory.FolderId, Directory.RequestID, fsw?.Path!, item));
    }
    void Deleted(object _, FileSystemEventArgs e)
    {
        var index = Directory.GetIndex(e.Name);
        Process(() => new(JobType.Deleted, Directory.FolderId, Directory.RequestID, fsw?.Path!, null, index), () => Directory.Delete(index));
    }
    void Changed(object _, FileSystemEventArgs e)
        => Process(() => new(JobType.Changed, Directory.FolderId, Directory.RequestID, fsw?.Path!, Directory.Change(e.Name, idx => CreateItem(e.FullPath, idx))));
    void Renamed(object _, RenamedEventArgs e)        
    {
        var oldIndex = Directory.GetIndex(e.OldName);
        if (oldIndex == -1)
        {
            var index = Directory.GetIndex(e.Name);
            if (index == -1)
            {
                var item = Directory.Create(e.FullPath);
                if (item == null)
                    return;
                Process(() => new(JobType.Created, Directory.FolderId, Directory.RequestID, fsw?.Path!, item));
            }
            else
                Process(() => new(JobType.Changed, Directory.FolderId, Directory.RequestID, fsw?.Path!, Directory.Change(e.Name, idx => CreateItem(e.FullPath, idx))));
        }
        else
        {
            var item = CreateItem(e.FullPath, Directory.GetIndex(e.Name));
            bool alreadyExists = Directory.Rename(oldIndex, e.Name ?? "") == false;
            Process(() => new(JobType.Renamed, Directory.FolderId, Directory.RequestID, fsw?.Path!, item, oldIndex, alreadyExists));
        }
    }

    static FileSystemWatcher CreateWatcher(string path)
        => new(path)
        {
            NotifyFilter = NotifyFilters.CreationTime
                        | NotifyFilters.DirectoryName
                        | NotifyFilters.FileName
                        | NotifyFilters.LastWrite
                        | NotifyFilters.Size,
            EnableRaisingEvents = true
        };

    static DirectoryItem CreateItem(string fullName, int idx)
        => System.IO.Directory.Exists(fullName)
            ? DirectoryItem.CreateDirItem(new DirectoryInfo(fullName), idx)
            : DirectoryItem.CreateFileItem(new FileInfo(fullName), idx);

    void Process(Func<DirectoryItemJob> createJob, Action? afterCreated = null)
    {
        try
        {
            var job = createJob();
            if (disposedValue)
                return;
            afterCreated?.Invoke();
            var cmd = job.GetEvent();
            if (cmd != null && !disposedValue)
                Requests.SendJson(cmd.Cmd);
            if (cmd?.ExtendedInfosJob != null)
                RunExtendedInfos(cmd.ExtendedInfosJob);
        }
        catch (FileNotFoundException) { }
        catch (Exception e)
        {
            Console.WriteLine($"Error occurred in DirectoryWatcher.Write {e}");
        }

        static void RunExtendedInfos(ExtendedInfosJob job)
        {
            extendedInfoJobs.TryAdd(job, job);
            extendedJobWorker.OnNext(true);
        }
    }

    static void ExtendedRun()
    {
        extendedJobWorker
            .Throttle(TimeSpan.FromMilliseconds(1000))
            .SelectMany(async _ =>
            {
                await Task.Run(() =>
                {
                    var jobs = Interlocked.Exchange(ref extendedInfoJobs, []).Keys.ToArray();
                    foreach (var folderJobs in jobs.GroupBy(n => n.FolderId))
                    {
                        foreach (var requestJobs in folderJobs.GroupBy(n => n.RequestId))
                        {
                            var exifItems = requestJobs
                                .SelectFilterNull(n =>
                                {
                                    var exif = ExifReader.GetExifData(n.File);
                                    return exif != null ? new ExifData(n.Idx, exif.DateTime, exif?.Latitude, exif?.Longitude) : null;
                                })
                                .ToArray(); 
                            var versionItems = requestJobs
                                .SelectFilterNull(n => FileVersion.GetVersion(n.File, n.Idx))
                                .ToArray(); 
                            Requests.SendJson(new(folderJobs.Key, EventCmd.ExtendedInfos, new EventData 
                            {
                                RequestId = requestJobs.Key, 
                                Versions = versionItems,
                                Exifs = exifItems 
                            }));
                        }
                    }
                });
                return true;
            })
            .Subscribe(n => { });
    }
    
    static DirectoryWatcher()
    {
        extendedJobWorker = new();
        ExtendedRun();
    }

    static readonly Subject<bool> extendedJobWorker;
    static ConcurrentDictionary<ExtendedInfosJob, ExtendedInfosJob> extendedInfoJobs = [];
    readonly TimeSpan RENAME_DELAY = TimeSpan.FromMilliseconds(200);
    readonly FileSystemWatcher? fsw;
    readonly ManualResetEvent renameEvent = new(false);

    #region IDisposable

    public void Dispose()
    {
        // Ändern Sie diesen Code nicht. Fügen Sie Bereinigungscode in der Methode "Dispose(bool disposing)" ein.
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!disposedValue)
        {
            if (disposing)
            {
                // Verwalteten Zustand (verwaltete Objekte) bereinigen
                fsw?.Dispose();
                fsw?.Created -= Created;
                fsw?.Deleted -= Deleted;
                fsw?.Changed -= Changed;
                fsw?.Renamed -= Renamed;
            }

            // Nicht verwaltete Ressourcen (nicht verwaltete Objekte) freigeben und Finalizer überschreiben
            // Große Felder auf NULL setzen
            disposedValue = true;
        }
    }

    // Finalizer nur überschreiben, wenn "Dispose(bool disposing)" Code für die Freigabe nicht verwalteter Ressourcen enthält
    // ~DirectoryWatcher()
    // {
    //     // Ändern Sie diesen Code nicht. Fügen Sie Bereinigungscode in der Methode "Dispose(bool disposing)" ein.
    //     Dispose(disposing: false);
    // }

    bool disposedValue;

    #endregion
}

record DirectoryItemJob(DirectoryWatcher.JobType Type, string FolderId, int RequestId, string Path, DirectoryItem? Item,
    int? ItemIndex = null, bool AlreadyExists = false)
{
    public EventJob? GetEvent()
        => Type == DirectoryWatcher.JobType.Renamed && Item != null && ItemIndex != null
            ? new(new(FolderId, EventCmd.Rename, new()
            {
                RenameData = new(ItemIndex.Value, Item, FolderId, AlreadyExists)
            }), GetExtended())
            : Type == DirectoryWatcher.JobType.Deleted && ItemIndex != null
            ? new(new(FolderId, EventCmd.Delete, new()
            {
                DeleteData = new(ItemIndex.Value, FolderId)
            }))
            : Type == DirectoryWatcher.JobType.Created && Item != null
            ? new(new(FolderId, EventCmd.Create, new()
            {
                CreateData = new(Item.Idx, FolderId, Item)
            }), GetExtended())
            : Type == DirectoryWatcher.JobType.Changed && Item != null
            ? new(new(FolderId, EventCmd.Change, new()
            {
                CreateData = new(Item.Idx, FolderId, Item)
            }), GetExtended())
            : null;

    ExtendedInfosJob? GetExtended()
    {
        var file = Path.AppendPath(Item?.Name);
        return Item?.Name != null && file != null && Directory.HasExtendedInfos(file)
            ? new(FolderId, RequestId, file, Item.Idx)
            : null;
    }
}

record ExtendedInfosJob(string FolderId, int RequestId, string File, int Idx)
{
    public IDisposable? Disposable { get; set; }
}
record EventJob(CommanderEvent Cmd, ExtendedInfosJob? ExtendedInfosJob = null);