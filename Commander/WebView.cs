using CsTools.Functional;
using LinqTools;
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
			.DebugUrl($"http://localhost:5173")
			.QueryString(() => Platform.QueryString)
            .OnStarted(() => new Thread(() => Events.StartEvents()).Start())
			.ConfigureHttp(http => http
				.ResourceWebroot("webroot", "/static")
				.UseSse("commander/sse", Events.Source)
#if DEBUG        
                .CorsOrigin("http://localhost:5173")
#endif        
                .MapGet("commander/getIcon", context => Directory.ProcessIcon(context, context.Request.Query["path"].ToString()))
                .MapGet("commander/file", context => Directory.ProcessFile(context, context.Request.Query["path"].ToString()))
                .MapGet("commander/getfavicon", context => Directory.ProcessFavicon(context))
           
                .JsonPost<GetFiles, GetFilesRequestResult>("commander/getfiles", Directory.GetFiles)
                .JsonPost<Empty, RootItem[]>("commander/getroot", Root.Get)
                .JsonPost<GetExtendedItems, GetExtendedItemsResult>("commander/getextendeditems", Directory.GetExtendedItems)
                .JsonPost<CancelExtendedItems, IOResult>("commander/cancelextendeditems", Directory.CancelExtendedItems)
                .JsonPost<CreateFolderParam, IOResult>("commander/createfolder", Directory.CreateFolder)
                .JsonPost<DeleteItemsParam, IOResult>("commander/deleteitems", Directory.DeleteItems)
                .JsonPost<RenameItemParam, IOResult>("commander/renameitem", Directory.RenameItem)
                //.JsonPost<CopyItemsParam, CopyItemsResult>("commander/copyitemsinfo", Directory.CopyItemsInfo)

                // .JsonPost<CopyItemsParam, IOResult>("commander/copyitems", CopyProcessor.AddItems)
                // .JsonPost<CopyItemsParam, IOResult>("commander/copyitemsfromremote", Remote.CopyItemsFromRemote)
                // .JsonPost<CopyItemsParam, IOResult>("commander/copyitemstoremote", Remote.CopyItemsToRemote)

                //.JsonPost<Empty, IOResult>("commander/cancelcopy", Directory.CancelCopy)
                .JsonPost<GetFiles, GetFilesRequestResult>("commander/getremotefiles", Remote.GetFiles)
                .JsonPost<RenameItemsParam, IOResult>("commander/renameitems", Directory.RenameItems)
                .JsonPost<RenameItemParam, IOResult>("commander/renameandcopy", Directory.RenameAndCopy)
                .JsonPost<OnEnterParam, IOResult>("commander/onenter", Directory.OnEnter)
#if Windows            
                .JsonPost<Empty, IOResult>("commander/initservices", Services.Init)            
                .JsonPost<Empty, ServiceItem[]>("commander/getservices", Services.Get)            
                .JsonPost<Empty, IOResult>("commander/cleanupservices", Services.CleanUp)            
                .JsonPost<StartServicesParam, IOResult>("commander/startservices", Services.Start)            
                .JsonPost<StartServicesParam, IOResult>("commander/stopservices", Services.Stop)            
                .JsonPost<ElevatedDriveParam, IOResult>("commander/elevatedrive", Directory.ElevateDrive)
                .MapGet("commander/startelevated", UacServer.StartElevated)
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