using System.Collections.Concurrent;
using System.Collections.Immutable;
using CsTools.Extensions;

class DirectoryWatcher : IDisposable
{
    public static void Initialize(string key, string? path)
        => watchers.AddOrUpdateLocked(key, 
            k => new DirectoryWatcher(key, path),
            (key, dw) => 
                dw == null
                ? new DirectoryWatcher(key, path)
                : dw.Path != path 
                ? new DirectoryWatcher(key, path).SideEffect(_ => dw.Dispose()) 
                : dw);

    DirectoryWatcher(string id, string? path)
    {
        this.id = id;
        Path = path;
        extendedInfos = path != null ? new(path) : null;
        fsw = Path != null 
                ? CreateWatcher(Path)
                : null;        
        if (fsw != null)
        {
            new Thread(_ => RunChange())
            {
                IsBackground = true
            }.Start();
            fsw.Deleted += (s, e)
                => SafeEvent(() => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Deleted, 
                                                new DirectoryItem(e.Name ?? "", 0, false, null, false, DateTime.MinValue)));
            fsw.Created += (s, e) 
                => SafeEvent(() => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Created, CreateItem(Path.AppendPath(e.Name))));
            fsw.Changed += (s, e) => 
            { 
                if (e.Name != null) 
                    changeQueue = changeQueue
                                    .Add(e.Name)
                                    .SideEffect(_ => renameEvent.Set()); 
            };
            fsw.Renamed += (s, e)
                => SafeEvent(() => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Renamed, CreateItem(Path.AppendPath(e.Name)), e.OldName));
        }
    }

    public string? Path { get; }

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

    static DirectoryItem CreateItem(string fullName)
        => Directory.IsDirectory(fullName)
            ? DirectoryItem.CreateDirItem(new DirectoryInfo(fullName))
            : DirectoryItem.CreateFileItem(new FileInfo(fullName));

    static void SafeEvent(Action action)
    {
        try 
        {
            action();
        }
        catch {}
    }

    void RunChange()            
    {
        while (true)
        {
            try
            {
                renameEvent.WaitOne();
                renameEvent.Reset();
                if (DateTime.Now < lastRenameUpdate + RENAME_DELAY)
                    Thread.Sleep(lastRenameUpdate + RENAME_DELAY - DateTime.Now);
                var items = Interlocked.Exchange(ref changeQueue, []).ToArray();
                lastRenameUpdate = DateTime.Now;
                items.ForEach(n =>
                {
                    extendedInfos?.FileChanged(n);
                    Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Changed, CreateItem(Path.AppendPath(n)));
                });
                    
            }
            catch { }
        }
    }

    static readonly ConcurrentDictionary<string, DirectoryWatcher> watchers = [];
    readonly TimeSpan RENAME_DELAY = TimeSpan.FromMilliseconds(200);
    readonly FileSystemWatcher? fsw;
    readonly string id;
    readonly ManualResetEvent renameEvent = new(false);
    readonly ExtendedInfos? extendedInfos;
    DateTime lastRenameUpdate = DateTime.MinValue;
    ImmutableHashSet<string> changeQueue = [];

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
                // Verwalteten Zustand (verwaltete Objekte) bereinigen
                fsw?.Dispose();

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


