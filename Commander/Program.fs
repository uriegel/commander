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
    .AddRequest("gettrackinfo", getTrackInfo)
    .AddRequest("getextendeditems", Directory.getExtendedInfos)
    .AddRequest("cancelextendeditems", Directory.cancelExtendedInfos)
    .AddRequest("onenter", Directory.onEnter)
    .AddRequest("onshowdir", Directory.onEnter)
    .AddRequest("renameitem", Directory.renameItem)
    .AddRequest("deleteitems", Directory.deleteItems)
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

// TODO Rename
// TODO Delete
// TODO CreateDir