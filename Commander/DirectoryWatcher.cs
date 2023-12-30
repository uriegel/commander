using System.Collections.Concurrent;
using System.Collections.Immutable;
using CsTools.Extensions;

// TODO call with path = null when a Controller != FileSystemController is selected
class DirectoryWatcher : IDisposable
{
    public static void Initialize(string key, string? path)
        => watchers.AddOrUpdateLocked(key, 
            k => new DirectoryWatcher(key, path),
            (key, dw) => dw == null
                ? new DirectoryWatcher(key, path)
                : dw.Path
                    .SideEffect(path => {
                        if (path == "/daten/Bilder/Fotos/2019/MarsaAlam")
                            {
                            TEST(path); 
                                
                            }

                    })  != path ? new DirectoryWatcher(key, path).SideEffect(_ => dw.Dispose()) : dw);

    static async void TEST(string path)
    {
        await Task.Delay(20);
        Enumerable.Range(1, 1110).Select(n => $"Bild{n:0000}.JPG").ForEach(n => Events.SendExif(path, n));
    }

    DirectoryWatcher(string id, string? path)
    {
        this.id = id;
        Path = path;
        fsw = Path != null 
                ? CreateWatcher(Path)
                : null;        
        if (fsw != null)
        {
            new Thread(_ => RunRename())
            {
                IsBackground = true
            }.Start();
            fsw.Created += (s, e) 
                => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Created, CreateItem(Path.AppendPath(e.Name)));
            fsw.Changed += (s, e) => { if (e.Name != null) renameQueue = renameQueue.Add(e.Name)
                .SideEffect(_ => renameEvent.Set()); };
            fsw.Renamed += (s, e)
                => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Renamed, CreateItem(Path.AppendPath(e.Name)), e.OldName);
            fsw.Deleted += (s, e)
                => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Deleted, new DirectoryItem(e.Name ?? "", 0, false, null, false, DateTime.MinValue));



            // TODO in folder /daten/Bilder/Fotos/2019/MarsaAlam after 3s send extended items name Bild0001.JPG .. Bild1111.JPG with exifdate 22.2.2222 22:22
            // TODO one event after another
            // TODO 10 events together
            // TODO view in javascript console
            // TODO update view
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

    void RunRename()            
    {
        while (true)
        {
            try
            {
                renameEvent.WaitOne();
                renameEvent.Reset();
                var items = Interlocked.Exchange(ref renameQueue, []).ToArray();
                if (DateTime.Now < lastRenameUpdate + RENAME_DELAY)
                    Thread.Sleep(lastRenameUpdate + RENAME_DELAY - DateTime.Now);
                lastRenameUpdate = DateTime.Now;
                items.ForEach(n =>
                    Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Changed, CreateItem(Path.AppendPath(n))));
            }
            catch { }
        }
    }

    static readonly ConcurrentDictionary<string, DirectoryWatcher> watchers = [];
    readonly TimeSpan RENAME_DELAY = TimeSpan.FromMilliseconds(500);
    readonly FileSystemWatcher? fsw;
    readonly string id;
    readonly ManualResetEvent renameEvent = new(false);
    DateTime lastRenameUpdate = DateTime.MinValue;
    ImmutableHashSet<string> renameQueue = [];

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

// TODO Dispose DirectoryWatcher disposes renameQueue
// TODO measure updates when 10 000 items are in view


