#if Windows
using CsTools.Extensions;

if (args.Length > 0 && args[0] == "-adminMode") 
{
    var cid = args[1].ParseInt();
    if (cid.HasValue)
        await UacServer.Run(cid.Value);
    return;
}
        
#endif

Window.Run();



