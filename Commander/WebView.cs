#if Windows
using System.Windows.Forms;
#endif
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
                .JsonPost<GetFiles, GetFilesResult, RequestError>("commander/getfiles", Directory.GetFiles)
                .JsonPost<GetExtendedItems, GetExtendedItemsResult, RequestError>("commander/getextendeditems", Directory.GetExtendedItems)
                .JsonPost<CancelExtendedItems, Nothing, RequestError>("commander/cancelextendeditems", Directory.CancelExtendedItems)
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
                .JsonPost<GetFiles, GetFilesRequestResult, RequestError>("commander/getremotefiles", Remote.GetFiles)
                .JsonPost<DeleteItemsParam, Nothing, RequestError>("commander/deleteitemsremote", Remote.Delete)
                .JsonPost<CreateDirectoryParam, Nothing, RequestError>("commander/createdirectoryremote", Remote.CreateDirectory)
                .JsonPost<GetTrackInfoParam, TrackInfoData, RequestError>("commander/gettrackinfo", TrackInfo.Get)
#if Windows            
                .JsonPost<Result<Credentials, RequestError>, Nothing, RequestError>("commander/sendcredentials", Directory.CredentialsReceived)            
                .JsonPost("commander/cleanupservices", Services.CleanUp)            
                .JsonPost("commander/getservices", Services.Get)            
                .JsonPost<StartServicesParam, Nothing, RequestError>("commander/startservices", Services.Start)            
                .JsonPost<StartServicesParam, Nothing, RequestError>("commander/stopservices", Services.Stop)  
#else
                .JsonPost<SetPreviewParam, Nothing, RequestError>("commander/setpreview", TitleBar.SetPreview)
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

