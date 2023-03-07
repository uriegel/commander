WebView
    .Create()
#if Linux
    .GtkSchema("de.uriegel.commander")
#endif    
    .InitialBounds(600, 800)
    .Title("Commander😎😎👌")
    .Build()
    .Run();
