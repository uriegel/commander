#if Windows

using CsTools.Extensions;

if (args.Length > 0 && args[0] == "-adminMode") 
{
    await UacServer.Run(args[1].ParseInt() ?? 0);
    return;
}
        
#endif

Window.Run();




