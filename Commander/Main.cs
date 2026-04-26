using WebServerLight;
using WebServerLight.Routing;
using static Requests;

var server =
    WebServer
        .New()
        .Http(8080)
#if DEBUG        
        .AddAllowedOrigin("http://localhost:5173")
#else
        .WebsiteFromResource()
#endif        
        .Route(MethodRoute
            .New(Method.Post, OnPostError)
                .Add(PathRoute.New("/requests/getdrives").Request(GetDrives))
                .Add(PathRoute.New("/requests/getfiles").Request(GetFiles))
                .Add(PathRoute.New("/requests/getitemsfinished").Request(GetItemsFinished))
                .Add(PathRoute.New("/requests/mount").Request(Mount))
                .Add(PathRoute.New("/requests/getaccentcolor").Request(GetAccentColor))
                .Add(PathRoute.New("/requests/closewindow").Request(CloseWindow))
                .Add(PathRoute.New("/requests/minimize").Request(Minimize))
                .Add(PathRoute.New("/requests/maximize").Request(Maximize))
                .Add(PathRoute.New("/requests/restore").Request(Restore))
                .Add(PathRoute.New("/requests/cmd").Request(Cmd))
            )
        .Route(MethodRoute
            .New(Method.Get)
                .Add(PathRoute.New("/iconfromname").Request(GetIconFromName))
                .Add(PathRoute.New("/iconfromext").Request(GetIconFromExtension))
            )
        .WebSocket(WebSocket)
        .Build();

Globals.InitializeResourceFiles();
Theme.StartChangeDetecting();
server.Start();
WebView.Run();
Icon.StopProcessing();    
server.Stop();



