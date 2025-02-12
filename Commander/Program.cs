using System.Reflection;
using WebServerLight;
using WebWindowNetCore;

var names = Assembly.GetEntryAssembly()?.GetManifestResourceNames();

var server =
    ServerBuilder
        .New()
        .Http(8080)
        .WebsiteFromResource()
        .JsonPost(Requests.JsonPost)
        .AddAllowedOrigin("http://localhost:5173")
        .AccessControlMaxAge(TimeSpan.FromHours(1))
        .Build();

server.Start();

WebView
    .Create()
    .AppId("de.uriegel.commander")
    .Title("Commander")
    .InitialBounds(600, 800)
    .SaveBounds()
    .DevTools()





    //.DefaultContextMenuDisabled()
    




#if Linux
    .WithHeaderbar(Linux.HeaderBar.Build)
#elif Windows
    .WithoutNativeTitlebar()
    .ResourceIcon("icon")
#endif
    .DebugUrl("http://localhost:5173")
    .Url("http://localhost:8080")
    .CanClose(() => true)
    .Run();
server.Stop();


// TODO react 5173 Linux: request not returning in WebKit
// TODO icons Linux python
// TODO Devtools
// TODO icons Windows
// TODO viewer images
// TODO viewer images with location, use shortcut crtl+F3, release version
// TODO viewer pdf
// TODO viewer Test mp4 without http server
// TODO Events class for sending events to react
// TODO root Linux: sdd when there is no sdd1
// TODO extended infos
// TODO Windows: version infos
// TODO Kurzschlüsse in react-menubar

