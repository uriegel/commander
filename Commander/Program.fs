open System
open System.Drawing
open WebWindowNetCore

WebView()
    .AppId("de.uriegel.commander")
    .InitialBounds(600, 800)
    .Title("Commander")
    .BackgroundColor(Color.Transparent)
    .ResourceIcon("icon")
    .ResourceFromHttp()
    .DebugUrl("http://localhost:5173")
    .CorsDomains([|"http://localhost:5173"|])
    .CorsCache(TimeSpan.FromSeconds(20))    
    .SaveBounds()
    .DefaultContextMenuDisabled()
#if DEBUG    
    .DevTools()
#endif
#if Linux
    .TitleBar(Titlebar.create)
#endif    
#if Windows
#endif
    .Run()
    |> ignore