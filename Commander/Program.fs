open System
open System.Drawing
open WebWindowNetCore
open Native

WebView()
    .AppId("de.uriegel.commander")
    .InitialBounds(600, 800)
    .Title("Commander")
    .BackgroundColor(Color.Transparent)
    .WithoutNativeTitlebar()
    .ResourceIcon("icon")
    .ResourceFromHttp()
    .DebugUrl("http://localhost:5173")
    .CorsDomains([|"http://localhost:5173"|])
    .CorsCache(TimeSpan.FromSeconds(20))    
    .SaveBounds()
    //.DefaultContextMenuDisabled()
#if DEBUG    
    .DevTools()
#endif
#if Linux
    .TitleBar(Titlebar.create)
#endif    
#if Windows
    .OnFormCreating(Titlebar.create)
#endif
    .Run()
    |> ignore