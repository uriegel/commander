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
        }   
        catch (FileNotFoundException) {}
        catch (Exception e)
        {
            Console.WriteLine($"Error occurred in DirectroyWatcher.Write {e}");
        }
    } 

    readonly TimeSpan RENAME_DELAY = TimeSpan.FromMilliseconds(200);
    readonly FileSystemWatcher? fsw;
    readonly ManualResetEvent renameEvent = new(false);
    //readonly ExtendedInfos? extendedInfos;

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
        => Item?.Name != null && Directory.HasExtendedInfos(Path.AppendPath(Item.Name))
            ? new(FolderId, RequestId, Item.Name)
            : null;
}

record ExtendedInfosJob(string FolderId, int RequestId, string File);
record EventJob(CommanderEvent Cmd, ExtendedInfosJob? ExtendedInfosJob = null);