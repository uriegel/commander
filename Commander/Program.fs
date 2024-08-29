open System
open System.Drawing
open WebWindowNetCore

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
    .DefaultContextMenuDisabled()
    .AddRequest("getroot", Root.get)
    .AddRequest("getfiles", Directory.getFiles)
#if DEBUG    
    .DevTools()
#endif
#if Linux
    .TitleBar(Titlebar.create)
#endif    
    .Run()
    |> ignore

// TODO Model assembly -> Windows assembly Linux assembly -> Commander
// TODO if input.Mount = Some true then 
// TODO Refresh
// TODO ShowHidden in UI: send event to javascript
// TODO ShowIcons
// TODO FileSystemWatcher
// TODO Exif datas
// TODO send Result or AsyncResult (access denied)
// TODO not fetch or jsonpost but WebView.request with AsyncResult as result
// TODO Files Windows
// TODO File versions
