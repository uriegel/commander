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
    .WithHeaderbar(Linux.HeaderBar.Get)
#elif Windows
    .WithoutNativeTitlebar()
    .ResourceIcon("icon")
#endif
    .DebugUrl("http://localhost:5173")
    .Url("res://react.test/index.html")
    .CanClose(() => true)
    .OnRequest(Requests.Process)
    .Run();

// TODO icons Linux
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

