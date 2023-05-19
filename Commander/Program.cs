#if Windows

if (args.Length > 0 && args[0] == "-adminMode") {
    await UacServer.Run();
    return;
}
        
#endif

Window.Run();



