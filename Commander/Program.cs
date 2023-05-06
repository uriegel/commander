using GtkDotNet;
using LinqTools;
using WebWindowNetCore;

WebView
    .Create()
#if Linux    
    .SideEffect(_ => Application.Start())
#endif    
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
        .MapGet("commander/getIcon", context => Directory.ProcessIcon(context, context.Request.Query["path"].ToString()))
        .MapGet("commander/file", context => Directory.ProcessFile(context, context.Request.Query["path"].ToString()))
        .JsonPost<GetFiles, GetFilesResult>("commander/getfiles", Directory.GetFiles)
        .JsonPost<Empty, RootItem[]>("commander/getroot", Root.Get)
        .JsonPost<GetExtendedItems, GetExtendedItemsResult>("commander/getextendeditems", Directory.GetExtendedItems)
        .JsonPost<CreateFolderParam, IOResult>("commander/createfolder", Directory.CreateFolder)
        .JsonPost<DeleteItemsParam, IOResult>("commander/deleteitems", Directory.DeleteItems)
        .JsonPost<RenameItemParam, IOResult>("commander/renameitem", Directory.RenameItem)
        .JsonPost<CopyItemsParam, CopyItemsResult>("commander/copyitemsinfo", Directory.CopyItemsInfo)
        .JsonPost<CopyItemsParam, IOResult>("commander/copyitems", Directory.CopyItems)
        .JsonPost<CopyItemsParam, IOResult>("commander/copyitemsfromremote", Remote.CopyItemsFromRemote)
        .JsonPost<CopyItemsParam, IOResult>("commander/copyitemstoremote", Remote.CopyItemsToRemote)
        .JsonPost<Empty, IOResult>("commander/cancelcopy", Directory.CancelCopy)
        .JsonPost<GetFiles, GetFilesResult>("commander/getremotefiles", Remote.GetFiles)
        .JsonPost<RenameItemsParam, IOResult>("commander/renameitems", Directory.RenameItems)
        .Build())
#if DEBUG            
    .DebuggingEnabled()
#endif       
    .Build()
    .Run("de.uriegel.Commander")
    .SideEffect(_ =>
    {
#if Linux
        Application.Stop();
#endif
    });

record Empty();

