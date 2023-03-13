using WebWindowNetCore;

WebView
    .Create()
    .InitialBounds(600, 800)
    .Title("Commander")
    .ResourceIcon("icon")
    .SaveBounds()
    .Url($"http://localhost:3000{Platform.QueryString}")
    //.DebugUrl("http://localhost:3000")
//    .ConfigureHttp(http => http
    //     .ResourceWebroot("webroot", "/web")
//        .UseSse()
//        .UseJsonPost<Object, Object>("commander/showdevtools", )
//        .Build())
#if DEBUG            
    .DebuggingEnabled()
#endif       
    .Build()
    .Run("de.uriegel.Commander");

// TODO SSE theme changed


