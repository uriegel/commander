WebView
    .Create()
    .InitialBounds(600, 800)
    .Title("Commander")
    .Url($"file://{Directory.GetCurrentDirectory()}/public/index.html")
    .ShowDevTools()
    .Build()
    .Run("de.uriegel.Commander");

