using LinqTools;
using WebWindowNetCore;

static class Window
{
	public static void Run()
		=> WebView
			.Create()
			.InitialBounds(600, 800)
			.Title("Commander")
			.ResourceIcon("icon")
			//.SaveBounds()
			.WithoutNativeTitlebar()
			.OnFilesDrop(OnFilesDrop)
			.OnWindowStateChanged(state => Events.WindowStateChanged(state == WebWindowNetCore.Data.WebWindowState.Maximized))
			.DebugUrl($"http://localhost:3000")
			//.QueryString(Platform.QueryString)
			.ConfigureHttp(http => http
				.ResourceWebroot("webroot", "/static")
				.UseSse("commander/sse", Events.Source)
				//.SideEffect(_ => Events.StartEvents())
#if DEBUG        
                .CorsOrigin("http://localhost:3000")
#endif        
                .MapGet("commander/getIcon", context => Directory.ProcessIcon(context, context.Request.Query["path"].ToString()))
                .MapGet("commander/file", context => Directory.ProcessFile(context, context.Request.Query["path"].ToString()))
                .MapGet("commander/getfavicon", context => Directory.ProcessFavicon(context))
                .JsonPost<GetFiles, GetFilesResult>("commander/getfiles", Directory.GetFiles)
                .JsonPost<Empty, RootItem[]>("commander/getroot", Root.Get)
                .JsonPost<GetExtendedItems, GetExtendedItemsResult>("commander/getextendeditems", Directory.GetExtendedItems)
                .JsonPost<CancelExtendedItems, IOResult>("commander/cancelextendeditems", Directory.CancelExtendedItems)
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
            .Run("de.uriegel.Commander");
  
	static void OnFilesDrop(string id, bool move, string[] paths)
		=> Directory.FilesDropped(id, move, paths);
}

record Empty();