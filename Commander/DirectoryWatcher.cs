using System.Collections.Immutable;
using System.Threading.Channels;
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
        fsw = CreateWatcher(path); 
        fsw.Created += (s, e) => Write(() => new(JobType.Created, CreateItem(e.FullPath, directory.GetIndex(e.Name))));
        fsw.Deleted += (s, e) => Write(() => new(JobType.Deleted, null, directory.GetIndex(e.Name)));
        fsw.Changed += (s, e) => Write(() => new(JobType.Changed, CreateItem(e.FullPath, directory.GetIndex(e.Name))));
        fsw.Renamed += (s, e) => Write(() => new(JobType.Renamed, CreateItem(e.FullPath, directory.GetIndex(e.Name)), directory.GetIndex(e.OldName)));
        // fsw.Deleted += (s, e)
        //     => SafeEvent(() => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Deleted, 
        //                                     new DirectoryItem(e.Name ?? "", 0, false, null, false, DateTime.MinValue)));
        // fsw.Created += (s, e) 
        //     => SafeEvent(() => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Created, CreateItem(Path.AppendPath(e.Name))));
        // fsw.Changed += (s, e) => 
        // { 
        //     if (e.Name != null) 
        //         changeQueue = changeQueue
        //                         .Add(e.Name)
        //                         .SideEffect(_ => renameEvent.Set()); 
        // };
        // fsw.Renamed += (s, e)
        //     => SafeEvent(() => Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Renamed, CreateItem(Path.AppendPath(e.Name)), e.OldName));
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
                    //extendedInfos?.FileChanged(n);
                    // Events.SendDirectoryChanged(id, Path, DirectoryChangedType.Changed, CreateItem(Path.AppendPath(n)));
                });

            }
            catch { }
        }
    }

    static async Task RunProcessing()
    {
        await foreach (var n in jobs.Reader.ReadAllAsync())
        {
            try
            {
                await Process(n);
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"Exception in directory watcher processing: {e}");
            }
        }
    }

    static void Write(Func<DirectoryItemJob> createJob)
    {
        try
        {
            jobs.Writer.TryWrite(createJob());
        }   
        catch (FileNotFoundException) {}
        catch (Exception e)
        {
            Console.WriteLine($"Error occurred in DirectroyWatcher.Write {e}");
        }
    } 

    static async Task Process(DirectoryItemJob job)
    {
        Console.WriteLine($"Event: {job}");
    }

    static DirectoryWatcher()
    {
        jobs = Channel.CreateUnbounded<DirectoryItemJob>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
        jobProcessorTask = Task.Run(RunProcessing);
    }

    static readonly Channel<DirectoryItemJob> jobs;
    static readonly Task jobProcessorTask;

    readonly TimeSpan RENAME_DELAY = TimeSpan.FromMilliseconds(200);
    readonly FileSystemWatcher? fsw;
    readonly ManualResetEvent renameEvent = new(false);
    //readonly ExtendedInfos? extendedInfos;
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

record DirectoryItemJob(DirectoryWatcher.JobType Type, DirectoryItem? Item, int? itemIndex = null);

