open System
open System.Drawing
open WebWindowNetCore
open Requests

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
    .Requests([getIcon; getFile])
    .OnEventSink(
        fun id webview -> Events.onEventSink id (
            fun d -> webview.SendEvent.Invoke(id, d)
        )
    )
#if DEBUG    
    .DevTools()
#endif
#if Linux
    .TitleBar(Titlebar.create)
#endif    
    .Run()
    |> ignore

// TODO Crash when changing preview items rapidly: Deadlock? not when serving preview from another process
// TODO GetTrackInfo
// TODO FileSystemWatcher
// TODO Exif datas
// TODO send Result or AsyncResult (access denied)
// TODO not fetch or jsonpost but WebView.request with AsyncResult as result
// TODO Files Windows
// TODO File versions
