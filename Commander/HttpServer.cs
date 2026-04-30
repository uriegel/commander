using WebServerLight;
using WebServerLight.Routing;

using static Requests;

static class HttpServer
{
    public static IServer New()
        => WebServer
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
                    .Add(PathRoute.New("/requests/createfolder").Request(CreateFolder))
                    .Add(PathRoute.New("/requests/delete").Request(DeleteItems))
                    .Add(PathRoute.New("/requests/flattenitems").Request(FlattenItems))
                    .Add(PathRoute.New("/requests/copy").Request(Copy))
                    .Add(PathRoute.New("/requests/onenter").Request(OnEnter))
            )
            .Route(MethodRoute
                .New(Method.Get)
                    .Add(PathRoute.New("/iconfromname").Request(GetIconFromName))
                    .Add(PathRoute.New("/iconfromext").Request(GetIconFromExtension))
                    .Add(PathRoute.New("/file").Request(GetFile))
                    .Add(PathRoute.New("/track").Request(GetTrack))
            )
            .WebSocket(WebSocket)
            .UseRange()
            .Build();
}