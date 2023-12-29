#if Windows

using CsTools.Extensions;

if (args.Length > 0 && args[0] == "-adminMode") 
{
    await UacServer.Run(args[1].ParseInt() ?? 0);
    return;
}
        
#endif

var fsw = new FileSystemWatcher("/media/uwe/Video")
{
    NotifyFilter = NotifyFilters.CreationTime
                    | NotifyFilters.DirectoryName
                    | NotifyFilters.FileName
                    | NotifyFilters.LastWrite
                    | NotifyFilters.Size,
    EnableRaisingEvents = true,
    IncludeSubdirectories = true
};
//fsw.Changed += (s, e) => Console.WriteLine($"Changed {e.Name} {e.}");
fsw.Created += (s, e) => Console.WriteLine($"Created {e.Name}");
fsw.Deleted += (s, e) => Console.WriteLine($"Deleted {e.Name}");
fsw.Renamed += (s, e) => Console.WriteLine($"Renamed {e.OldName}, {e.Name}");


Window.Run();



