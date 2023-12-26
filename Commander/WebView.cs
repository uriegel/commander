using AspNetExtensions;
using CsTools.Functional;
using WebWindowNetCore;

static class Window
{
	public static void Run()
		=> WebView
			.Create()
            .SetAppId("de.uriegel.Commander")
			.InitialBounds(600, 800)
			.Title("Commander")
#if Linux
            .DownCast<WebViewBuilder>()
            .TitleBar(TitleBar.New)
#endif            
			.ResourceIcon("icon")
			.SaveBounds()
			.WithoutNativeTitlebar()
			.OnFilesDrop(OnFilesDrop)
			.OnWindowStateChanged(state => Events.WindowStateChanged(state == WebWindowNetCore.Data.WebWindowState.Maximized))
			.QueryString(() => Platform.QueryString)
            .OnStarted(() => 
            
            new Thread(() => Events.StartEvents()).Start())
            .DebugUrl($"http://localhost:5173")
			.ConfigureHttp(http => http
				.ResourceWebroot("webroot", "/static")
				.UseSse("commander/sse", Events.Source)
#if DEBUG        
                .CorsOrigin("http://localhost:5173")
#endif            
                .MapGet("commander/getIcon", context => Directory.ProcessIcon(context, context.Request.Query["path"].ToString()))
                .MapGet("commander/file", context => Directory.ProcessFile(context, context.Request.Query["path"].ToString()))
                .MapGet("commander/getfavicon", context => Directory.ProcessFavicon(context))
                .JsonPost<GetFiles, GetFilesResult, GetFilesError>("commander/getfiles", Directory.GetFiles)
                .JsonPost<RenameItemParam, Nothing, RequestError>("commander/renameitem", Directory.RenameItem)
                .JsonPost<CreateFolderParam, Nothing, RequestError>("commander/createfolder", Directory.CreateFolder)
                .JsonPost<DeleteItemsParam, Nothing, RequestError>("commander/deleteitems", Directory.DeleteItems)
                .JsonPost("commander/getroot", Root.Get)
                // TODO ??
                .JsonPost<GetExtendedItems, GetExtendedItemsResult>("commander/getextendeditems", Directory.GetExtendedItems)
                .JsonPost<CancelExtendedItems, IOResult>("commander/cancelextendeditems", Directory.CancelExtendedItems)
                // TODO
                .JsonPost<CopyItemsParam, CopyItemsResult>("commander/copyitemsinfo", Directory.CopyItemsInfo)
                // TODO
                .JsonPost<CopyItemsParam, IOResult>("commander/copyitems", CopyProcessor.AddItems)
                // .JsonPost<CopyItemsParam, IOResult>("commander/copyitemsfromremote", Remote.CopyItemsFromRemote)
                // .JsonPost<CopyItemsParam, IOResult>("commander/copyitemstoremote", Remote.CopyItemsToRemote)
                //.JsonPost<Empty, IOResult>("commander/cancelcopy", Directory.CancelCopy)
                // TODO
                .JsonPost<GetFiles, GetFilesRequestResult>("commander/getremotefiles", Remote.GetFiles)
                // TODO
                .JsonPost<RenameItemsParam, IOResult>("commander/renameitems", Directory.RenameItems)
                // TODO
                .JsonPost<RenameItemParam, IOResult>("commander/renameandcopy", Directory.RenameAndCopy)
                // TODO
                .JsonPost<OnEnterParam, IOResult>("commander/onenter", Directory.OnEnter)
#if Windows            
                .JsonPost<Result<Credentials, RequestError>, Nothing, RequestError>("commander/sendcredentials", Directory.CredentialsReceived)            

                // TODO
                .JsonPost<Empty, IOResult>("commander/initservices", Services.Init)            
                // TODO
                .JsonPost<Empty, ServiceItem[]>("commander/getservices", Services.Get)            
                // TODO
                .JsonPost<Empty, IOResult>("commander/cleanupservices", Services.CleanUp)            
                // TODO
                .JsonPost<StartServicesParam, IOResult>("commander/startservices", Services.Start)            
                // TODO
                .JsonPost<StartServicesParam, IOResult>("commander/stopservices", Services.Stop)            
#endif            
                .Build())
#if DEBUG
            .DebuggingEnabled()
#endif
            .Build()
            .Run();
  
	static void OnFilesDrop(string id, bool move, string[] paths)
		=> Directory.FilesDropped(id, move, paths);
}

record Empty();