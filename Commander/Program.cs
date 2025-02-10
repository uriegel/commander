using System.Reflection;
using WebServerLight;
using WebWindowNetCore;

var names = Assembly.GetEntryAssembly()?.GetManifestResourceNames();

var server =
    ServerBuilder
        .New()
        .Http(8080)
        .WebsiteFromResource("")
        .Build();
    
server.Start();


WebView
    .Create()
    .AppId("de.uriegel.commander")
    .Title("Commander")
    .InitialBounds(600, 800)
    .SaveBounds()
    .DevTools()
    .DefaultContextMenuDisabled()
#if Linux    
    .WithHeaderbar(Linux.HeaderBar.Get)
#elif Windows
    .WithoutNativeTitlebar()
    .ResourceIcon("icon")
#endif
    //.DebugUrl("http://localhost:5173")
    //.Url("res://commander.react")
    .Url("http://localhost:8080")
    .CanClose(() => true)
    .OnRequest(Requests.Process)
    .OnResourceRequest(Requests.OnResource)
    .Run();


// TODO icons Linux
// TODO icons Windows
// TODO Custom requests instead of alert Linux
// TODO Custom requests instead of Messages Windows
// TODO viewer images
// TODO viewer images with location, use shortcut crtl+F3, release version
// TODO viewer pdf
// TODO viewer Test mp4 without http server
// TODO Events class for sending events to react
// TODO root Linux: sdd when there is no sdd1
// TODO extended infos
// TODO Windows: version infos
// TODO Kurzschlüsse in react-menubar

