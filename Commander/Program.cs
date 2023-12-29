#if Windows

using CsTools.Extensions;

if (args.Length > 0 && args[0] == "-adminMode") 
{
    await UacServer.Run(args[1].ParseInt() ?? 0);
    return;
}
        
#endif

// TODO FSW for both sides
// TODO creates sse events 
// TODO onChanged with 0,5s pausings observable filter
// TODO CopyItem file, on change sends file sizes update view 
// TODO measure updates when 10 000 items are in view
// TODO Rename file, check file changed event with sorting 

// var fsw = new FileSystemWatcher("/media/uwe/Video")
// //var fsw = new FileSystemWatcher(@"\\vme-win2016\c$\Datenaustauschverzeichnis")
// {
//     NotifyFilter = NotifyFilters.CreationTime
//                     | NotifyFilters.DirectoryName
//                     | NotifyFilters.FileName
//                     | NotifyFilters.LastWrite
//                     | NotifyFilters.Size,
//     EnableRaisingEvents = true,
//     IncludeSubdirectories = true
// };
// //fsw.Changed += (s, e) => Console.WriteLine($"Changed {e.Name} {e.}");
// fsw.Created += (s, e) => Console.WriteLine($"Created {e.Name}");
// fsw.Deleted += (s, e) => Console.WriteLine($"Deleted {e.Name}");
// fsw.Renamed += (s, e) => Console.WriteLine($"Renamed {e.OldName}, {e.Name}");


Window.Run();



