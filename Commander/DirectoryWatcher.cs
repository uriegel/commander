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
        fsw.Created += (s, e) => Write(() => new(JobType.Created, directory.FolderId, CreateItem(e.FullPath, directory.GetIndex(e.Name))));
        fsw.Deleted += (s, e) => Write(() => new(JobType.Deleted, directory.FolderId, null, directory.GetIndex(e.Name)));
        fsw.Changed += (s, e) => Write(() => new(JobType.Changed, directory.FolderId, CreateItem(e.FullPath, directory.GetIndex(e.Name))));
        fsw.Renamed += (s, e) => Write(() => new(JobType.Renamed, directory.FolderId, CreateItem(e.FullPath, directory.GetIndex(e.Name)), directory.GetIndex(e.OldName)));
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

        var cmd = job.GetEvent();
        if (cmd != null)
            Requests.SendJson(cmd);
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

record DirectoryItemJob(DirectoryWatcher.JobType Type, string FolderId, DirectoryItem? Item, int? ItemIndex = null)
{
    public CommanderEvent? GetEvent()
        => Type == DirectoryWatcher.JobType.Renamed && Item != null && ItemIndex != null
            ? new(FolderId, EventCmd.Rename, new()
            {
                RenameData = new(ItemIndex.Value, Item.Name, FolderId)
            })
            : null;
}

