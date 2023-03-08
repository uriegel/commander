WebView
    .Create()
    .InitialBounds(600, 800)
    .Title("Commander")
    .Url($"file://{Directory.GetCurrentDirectory()}/public/index.html")
    .ShowDevTools()
    .Build()
    .Run("de.uriegel.Commander");

// TODO
// run javascript get button, set click handler, show devtools
// save/restore bounds if requested
// host web site in kestrel and resources
// To GtkDotNet
// Then to GtkDotNet.Linux
// Windows version

