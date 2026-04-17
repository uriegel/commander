using System.Drawing;
using WebWindowNetCore;

WebView
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
    .CanClose(() => true)
    .Run();

