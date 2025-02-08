using System.Drawing;
using System.Reflection;
using WebWindowNetCore;

var names = Assembly.GetEntryAssembly()?.GetManifestResourceNames();

WebView
    .Create()
    .AppId("de.uriegel.commander")
    .Title("Commander")
    .InitialBounds(600, 800)
    .SaveBounds()
    .DevTools()
    .DefaultContextMenuDisabled()
#if Linux    
    .WithBuilder(Linux.HeaderBar.WithBuilder)
#elif Windows
    .WithoutNativeTitlebar()
    .ResourceIcon("icon")
#endif
    .DebugUrl("http://localhost:5173")
    .Url("res://react.test/index.html")
    .QueryString("?param1=123&param2=456")
    .CanClose(() => true)
    .OnRequest(Requests.Process)
    .Run();

// TODO Windows: getroot
// TODO getfiles

