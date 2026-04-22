using WebServerLight;
using WebServerLight.Routing;

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
            .New(Method.Post)
                .Add(PathRoute.New("/requests/getdrives").Request(Requests.GetDrives))
                .Add(PathRoute.New("/requests/getfiles").Request(Requests.GetFiles))
                .Add(PathRoute.New("/requests/cancelexifs").Request(Requests.CancelExifs))
                .Add(PathRoute.New("/requests/getitemsfinished").Request(Requests.GetItemsFinished))
                .Add(PathRoute.New("/requests/getaccentcolor").Request(Requests.GetAccentColor))
                .Add(PathRoute.New("/requests/closewindow").Request(Requests.CloseWindow))
                .Add(PathRoute.New("/requests/minimize").Request(Requests.Minimize))
                .Add(PathRoute.New("/requests/maximize").Request(Requests.Maximize))
                .Add(PathRoute.New("/requests/restore").Request(Requests.Restore))
                .Add(PathRoute.New("/requests/cmd").Request(Requests.Cmd))
            )
        .Route(MethodRoute
            .New(Method.Get)
                .Add(PathRoute.New("/icon")).Request(Requests.GetIcon)
            )
        .WebSocket(Requests.WebSocket)
        .Build();

Globals.InitializeResourceFiles();
Theme.StartChangeDetecting();
server.Start();
WebView.Run();
Icon.StopProcessing();    
server.Stop();



