using System.Drawing;
using WebWindowNetCore;
using WebServerLight;
using WebServerLight.Routing;

var webView = WebView
    .Create()
    .AppId(Globals.APP_ID)
    .Title("Commander")
    .InitialBounds(600, 800)
    .SaveBounds()
    .DevTools()
    .BackgroundColor(Color.Transparent)
    //.DefaultContextMenuDisabled()
#if Windows
    //.ResourceIcon("icon")
#endif
    .DebugUrl("http://localhost:5173/")
    .Url("http://localhost:8080")
    .CanClose(() => true);

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
                .Add(PathRoute.New("/requests/cancelexifs").Request(Requests.CancelExifs))
                .Add(PathRoute.New("/requests/getitemsfinished").Request(Requests.GetItemsFinished))
                .Add(PathRoute.New("/requests/getaccentcolor").Request(Requests.GetAccentColor))
            )
        .Route(MethodRoute
            .New(Method.Get)
                .Add(PathRoute.New("/icon")).Request(Requests.GetIcon))
        .WebSocket(Requests.WebSocket)
        .Build();

Globals.InitializeResourceFiles();
Theme.StartChangeDetecting();
server.Start();
webView.Run();
Icon.StopProcessing();    
server.Stop();



