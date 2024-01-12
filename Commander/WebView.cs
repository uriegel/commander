#if Windows
using System.Windows.Forms;
#endif
using AspNetExtensions;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using WebWindowNetCore;

using static CsTools.Core;

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
#if Windows
            .DownCast<WebViewBuilder>()
            .FormCreating(f => refForm.Value = f)
#endif                        
			.ResourceIcon("icon")
			.SaveBounds()
			.WithoutNativeTitlebar()
			.OnFilesDrop(OnFilesDrop)
			.OnWindowStateChanged(state => Events.WindowStateChanged(state == WebWindowNetCore.Data.WebWindowState.Maximized))
			.QueryString(() => Platform.QueryString)
            .OnStarted(() => new Thread(() => Events.StartEvents()).Start())
            .OnClosing(CopyProcessor.WantClose)
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
                .JsonPost<GetExtendedItems, GetExtendedItemsResult, GetFilesError>("commander/getextendeditems", Directory.GetExtendedItems)
                .JsonPost<CancelExtendedItems, Nothing, GetFilesError>("commander/cancelextendeditems", Directory.CancelExtendedItems)
                .JsonPost<RenameItemParam, Nothing, RequestError>("commander/renameitem", Directory.RenameItem)
                .JsonPost<CreateFolderParam, Nothing, RequestError>("commander/createfolder", Directory.CreateFolder)
                .JsonPost<DeleteItemsParam, Nothing, RequestError>("commander/deleteitems", Directory.DeleteItems)
                .JsonPost("commander/getroot", Root.Get)
                .JsonPost<CopyItemsParam, CopyItemInfo[], RequestError>("commander/copyitemsinfo", Directory.CopyItemsInfo)
                .JsonPost<CopyItemsParam, Nothing, RequestError>("commander/copyitems", CopyProcessor.AddItems)
                .JsonPost<OnEnterParam, Nothing, RequestError>("commander/onenter", Directory.OnEnter)
                .JsonPost("commander/cancelcopy", CopyProcessor.CancelRequest)
                .JsonPost<RenameItemsParam, Nothing, RequestError>("commander/renameitems", Directory.RenameItems)
                .JsonPost<RenameItemParam, Nothing, RequestError>("commander/renameascopy", Directory.RenameAsCopy)
                .JsonPost("commander/close", Close)
                // TODO
                // .JsonPost<CopyItemsParam, IOResult>("commander/copyitemsfromremote", Remote.CopyItemsFromRemote)
                // .JsonPost<CopyItemsParam, IOResult>("commander/copyitemstoremote", Remote.CopyItemsToRemote)
                // .JsonPost<GetFiles, GetFilesRequestResult>("commander/getremotefiles", Remote.GetFiles)
#if Windows            
                .JsonPost<Result<Credentials, RequestError>, Nothing, RequestError>("commander/sendcredentials", Directory.CredentialsReceived)            
                .JsonPost("commander/cleanupservices", Services.CleanUp)            
                .JsonPost("commander/getservices", Services.Get)            
                // .JsonPost<StartServicesParam, IOResult>("commander/startservices", Services.Start)            
                // .JsonPost<StartServicesParam, IOResult>("commander/stopservices", Services.Stop)            
#endif            
                .Build())
#if DEBUG
            .DebuggingEnabled()
#endif
            .Build()
            .Run();

#if Windows            
    static void CloseWindow()
        => refForm.Value?.Invoke(() => refForm.Value?.Close());
       
    static readonly RefCell<Form> refForm = new();
#else
    static void CloseWindow() {}
#endif            
  
	static void OnFilesDrop(string id, bool move, string[] paths)
		=> Directory.FilesDropped(id, move, paths);

    static AsyncResult<Nothing, RequestError> Close()
        => Ok<Nothing, RequestError>(nothing)
            .SideEffect(_ => CloseWindow())
            .ToAsyncResult();
}

