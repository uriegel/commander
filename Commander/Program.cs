using LinqTools;
using WebWindowNetCore;

WebView
    .Create()
    .InitialBounds(600, 800)
    .Title("Commander")
    .ResourceIcon("icon")
    .SaveBounds()
    .Url($"http://localhost:3000{Platform.QueryString}")
#if DEBUG        
    //.DebugUrl("http://localhost:3000")
#endif            
    .ConfigureHttp(http => http
    //     .ResourceWebroot("webroot", "/web")
        .UseSse("commander/sse", Events.Source)
        .SideEffect(_ => Events.StartEvents())
#if DEBUG        
        .CorsOrigin("http://localhost:3000")
#endif        
        .MapGet("commander/getIcon", context =>  Directory.ProcessIcon(context, context.Request.Query["path"].ToString()))
        .JsonPost<GetFiles, GetFilesResult>("commander/getfiles", Directory.GetFiles)
        .JsonPost<Empty, RootItem[]>("commander/getroot", Root.Get)
        .Build())
#if DEBUG            
    .DebuggingEnabled()
#endif       
    .Build()
    .Run("de.uriegel.Commander");

record Empty();


// TODO serve preview files
// TODO serve release version from resource
