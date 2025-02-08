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

// TODO getfiles
// TODO icons Linux
// TODO icons Windows
// TODO viewer images
// TODO viewer images with location, use shortcut crtl+F3, release version
// TODO viewer pdf
// TODO viewer Test mp4 without http server
// TODO extended infos
// TODO Windows: version infos
// TODO Kurzschlüsse in react-menubar

