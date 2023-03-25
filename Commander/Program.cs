using LinqTools;
using WebWindowNetCore;

WebView
    .Create()
    .InitialBounds(600, 800)
    .Title("Commander")
    .ResourceIcon("icon")
    .SaveBounds()
    .DebugUrl($"http://localhost:3000")
    .QueryString(Platform.QueryString)
    .ConfigureHttp(http => http
        .ResourceWebroot("webroot", "/static")        
        .UseSse("commander/sse", Events.Source)
        .SideEffect(_ => Events.StartEvents())
#if DEBUG        
        .CorsOrigin("http://localhost:3000")
#endif        
        .MapGet("commander/getIcon", context =>  Directory.ProcessIcon(context, context.Request.Query["path"].ToString()))
        .MapGet("commander/image", context =>  Directory.ProcessFile(context, context.Request.Query["path"].ToString()))
        .MapGet("commander/file", context =>  Directory.ProcessFile(context, context.Request.Query["path"].ToString()))
        .MapGet("commander/movie", context =>  Directory.ProcessMovie(context, context.Request.Query["path"].ToString()))
        .JsonPost<GetFiles, GetFilesResult>("commander/getfiles", Directory.GetFiles)
        .JsonPost<Empty, RootItem[]>("commander/getroot", Root.Get)
        .JsonPost<GetExtendedItems, GetExtendedItemsResult>("commander/getextendeditems", Directory.GetExtendedItems)
        .JsonPost<CreateFolderParam, IOResult>("commander/createfolder", Directory.CreateFolder)
        .JsonPost<DeleteItemsParam, IOResult>("commander/deleteitems", Directory.DeleteItems)
        .Build())
#if DEBUG            
    .DebuggingEnabled()
#endif       
    .Build()
    .Run("de.uriegel.Commander");

record Empty();

// TODO CreateFolder Exceptions
// TODO Delete items Exceptions
// TODO Delete items Windows
// TODO Rename
// TODO Copy
