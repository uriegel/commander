using System.Drawing;
using WebWindowNetCore;
using WebServerLight;
using WebServerLight.Routing;

var webView = WebView
    .Create()
    .AppId("de.uriegel.commander")
    .Title("Commander")
    .InitialBounds(600, 800)
    .SaveBounds()
    .DevTools()
    .BackgroundColor(Color.Transparent)
    //.DefaultContextMenuDisabled()
#if Windows
    .ResourceIcon("icon")
#endif
    .DebugUrl("http://localhost:5173/")
    .Url("https://github.com")
    .CanClose(() => true);

var server =
    WebServer
        .New()
        .Http(8080)
        //.WebsiteFromResource()
        .AddAllowedOrigin("http://localhost:5173")
        .Route(MethodRoute
            .New(Method.Post)
                .Add(PathRoute.New("/requests/getdrives").Request(Requests.GetDrives))
                .Add(PathRoute.New("/requests/cancelexifs").Request(Requests.CancelExifs))
                .Add(PathRoute.New("/requests/getitemsfinished").Request(Requests.GetItemsFinished))
                .Add(PathRoute.New("/requests/getaccentcolor").Request(Requests.GetAccentColor))
            )
        .Build();

server.Start();
webView.Run();
server.Stop();    

