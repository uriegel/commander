#if Windows

using CsTools.Extensions;
using LinqTools;

if (args.Length > 0 && args[0] == "-adminMode") 
{
    var cid = args[1]
            .ParseInt()
            .GetOrDefault(0);
    await UacServer.Run(cid);
    return;
}
        
#endif

Window.Run();



