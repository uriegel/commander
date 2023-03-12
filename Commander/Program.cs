WebView
    .Create()
    .InitialBounds(600, 800)
    .Title("Commander")
    .SaveBounds()
    .Url("http://localhost:3000")
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

// TODO commander showdevtools

