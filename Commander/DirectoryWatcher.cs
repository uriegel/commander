using System.Collections.Immutable;
using CsTools.Extensions;

// TODO call with path = null when a Controller != FileSystemController is selected
class DirectoryWatcher(string path) : IDisposable
{
    public static void Initialize(string key, string path)
        => watchers = watchers.AddOrUpdate(key, dw =>
        {
            dw?.Dispose();
            return new DirectoryWatcher(path);
        });

    // fsw.Created += (s, e) => Console.WriteLine($"Created {e.Name}");
    // fsw.Deleted += (s, e) => Console.WriteLine($"Deleted {e.Name}");
    // fsw.Renamed += (s, e) => Console.WriteLine($"Renamed {e.OldName}, {e.Name}");

    readonly FileSystemWatcher fsw = new FileSystemWatcher(path)
    {
        NotifyFilter = NotifyFilters.CreationTime
                        | NotifyFilters.DirectoryName
                        | NotifyFilters.FileName
                        | NotifyFilters.LastWrite
                        | NotifyFilters.Size,
        EnableRaisingEvents = true,
        IncludeSubdirectories = true
    }.SideEffect(n =>
    {
        n.Changed += (s, e) => Console.WriteLine($"Changed {e.Name}");
        n.Renamed += (s, e) => Console.WriteLine($"Renamed {e.OldName}, {e.Name}");
    });

    static ImmutableDictionary<string, DirectoryWatcher> watchers = ImmutableDictionary<string, DirectoryWatcher>.Empty;

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
                fsw.Dispose();

            // Nicht verwaltete Ressourcen (nicht verwaltete Objekte) freigeben und Finalizer überschreiben
            // Große Felder auf NULL setzen
            disposedValue = true;
        }
    }

    // // TODO: Finalizer nur überschreiben, wenn "Dispose(bool disposing)" Code für die Freigabe nicht verwalteter Ressourcen enthält
    // ~DirectoryWatcher()
    // {
    //     // Ändern Sie diesen Code nicht. Fügen Sie Bereinigungscode in der Methode "Dispose(bool disposing)" ein.
    //     Dispose(disposing: false);
    // }

    bool disposedValue;

    #endregion
}

// TODO FSW for both sides
// TODO creates sse events 
// TODO onChanged with 0,5s pausings observable filter
// TODO CopyItem file, on change sends file sizes update view 
// TODO measure updates when 10 000 items are in view
// TODO Rename file, check file changed event with sorting 

