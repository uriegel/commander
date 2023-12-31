
using System.Collections.Concurrent;
using CsTools.Extensions;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;

class ExtendedInfos : IDisposable
{
    public ExtendedInfos(string path)
        => Path = path;

    public string Path { get; }
    
    public void FileChanged(string name)
    {
        try
        {
            // TODO Windows Version
            if (!disposedValue && (name.EndsWith(".jpg", StringComparison.InvariantCultureIgnoreCase) || name.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase)))
                filesToCheck.AddOrUpdate(name, new InfoCheck(name, this), (name, check) => check.Updated());
        }
        catch (Exception e)
        {
            Console.WriteLine($"Unexpected error {e}");
        }
    }

    class InfoCheck
    {
        public InfoCheck(string name, ExtendedInfos infos) 
        {
            this.name = name;
            this.infos = infos;
            DelayedCheck();
        } 

        public InfoCheck Updated()
        {
            lastUpdate = DateTime.Now;
            return this;
        }

        async void DelayedCheck()
        {
            while (true)
            {
                try 
                {
                    var span = GetTimeSpan();
                    if (span.HasValue)
                        await Task.Delay(span.Value);
                    if (GetTimeSpan()?.TotalSeconds > 0)
                        continue; 
                    try 
                    {
                        if (infos.filesToCheck.TryRemove(name, out var info))
                        {
                            var exif = GetExifDate(infos.Path.AppendPath(name));
                            if (exif.HasValue)
                                Events.SendExif(infos.Path, name, exif.Value);
                        }
                    }
                    catch {}
                    break;
                }
                catch 
                {}
            }
        }

        static DateTime? GetExifDate(string file)
        {
            try
            {
                var directories = ImageMetadataReader.ReadMetadata(file);
                var subIfdDirectory = directories.OfType<ExifSubIfdDirectory>().FirstOrDefault();
                return (subIfdDirectory
                        ?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal)
                            .WhiteSpaceToNull()
                        ?? subIfdDirectory
                            ?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal)
                            .WhiteSpaceToNull()
                        ?? "")
                            .ToDateTime("yyyy:MM:dd HH:mm:ss");
            }
            catch { return null; }
        }

        TimeSpan? GetTimeSpan()
        {
            var span = TimeSpan.FromMilliseconds(500) - (DateTime.Now - lastUpdate);
            return span.TotalSeconds >= 0
                    ? span 
                    : null;
        }

        readonly ExtendedInfos infos;
        readonly string name;
        DateTime lastUpdate = DateTime.Now;
    }

    readonly ConcurrentDictionary<string, InfoCheck> filesToCheck = [];
    
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
                filesToCheck.Clear();
            }

            // Nicht verwaltete Ressourcen (nicht verwaltete Objekte) freigeben und Finalizer überschreiben
            // Große Felder auf NULL setzen
            disposedValue = true;
        }
    }

    // Finalizer nur überschreiben, wenn "Dispose(bool disposing)" Code für die Freigabe nicht verwalteter Ressourcen enthält
    // ~ExtendedInfos()
    // {
    //     // Ändern Sie diesen Code nicht. Fügen Sie Bereinigungscode in der Methode "Dispose(bool disposing)" ein.
    //     Dispose(disposing: false);
    // }

    bool disposedValue;

    #endregion
}
//        Enumerable.Range(1, 1110).Select(n => $"Bild{n:0000}.JPG").ForEach(n => Events.SendExif(path, n));

