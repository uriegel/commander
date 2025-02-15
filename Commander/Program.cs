using System.Reflection;
using WebServerLight;
using WebWindowNetCore;

var names = Assembly.GetEntryAssembly()?.GetManifestResourceNames();

var server =
    ServerBuilder
        .New()
        .Http(Globals.Port)
        .WebsiteFromResource()
        .JsonPost(Requests.JsonPost)
        .Get(Requests.OnGet)
        .WebSocket(Events.Create)
        .AddAllowedOrigin("http://localhost:5173")
        .AccessControlMaxAge(TimeSpan.FromHours(1))
        .Build();

server.Start();

Globals.WebView =
    WebView
    .Create()
    .AppId(Globals.AppId)
    .Title("Commander")
    .InitialBounds(600, 800)
    .SaveBounds()
    .DevTools()
    .DefaultContextMenuDisabled()
#if Linux
    .WithHeaderbar(Linux.HeaderBar.Build)
#elif Windows
    .WithoutNativeTitlebar()
    .ResourceIcon("icon")
#endif
    .DebugUrl("http://localhost:5173")
    .Url($"http://localhost:{Globals.Port}")
    .QueryString($"?port={Globals.Port}")
    .CanClose(() => true);

Globals.WebView.Run();
server.Stop();

// TODO Track viewer
// TODO viewer mp4 with Ranges
// TODO root Linux: sdd when there is no sdd1
// TODO Kurzschlüsse in react-menubar

