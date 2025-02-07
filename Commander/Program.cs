using System.Drawing;
using System.Reflection;
using CsTools.Extensions;
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
    .BackgroundColor(Color.Transparent)
#if Windows    
    .WithoutNativeTitlebar()
    //.ResourceIcon("icon")
#endif    
    .DebugUrl("http://localhost:5173")
    .Url("res://react.test/index.html")
    .QueryString("?param1=123&param2=456")
    .CanClose(() => true)
    .Run();

// TODO Windows: Titlebar
// TODO Linux: Titlebar