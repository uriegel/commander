WebView
    .Create()
    .InitialBounds(600, 800)
    .Title("Commander")
    .Url($"file://{Directory.GetCurrentDirectory()}/public/index.html")
    .ShowDevTools()
    .Build()
    .Run("de.uriegel.Commander");

// TODO run javascript get button, set click handler, show devtools
// TODO save/restore bounds if requested
// TODO host web site in kestrel and resources
// TODO To GtkDotNet nuget 0.0.1alpha
// TODO Then to GtkDotNet.Linux nuget 0.0.1alpha
// TODO Windows version

