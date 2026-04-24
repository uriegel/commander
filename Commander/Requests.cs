using System.Threading.Channels;
using WebServerLight;

static class Requests
{
    public static async Task<bool> GetDrives(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
        var drives = await Drive.Get();
        var response = new DriveItemResponse(drives, "root", drives.Length);
        await request.SendJsonAsync(response);
        return true;
    }

    public static async Task<bool> GetFiles(IRequest request)
    {
        var getFiles = await request.DeserializeAsync<GetFilesInput>();
        var response = Directory.Get(getFiles);
        await request.SendJsonAsync(response);
        return true;
    }

    public static async Task<bool> CancelExifs(IRequest request)
    {
        var data = await request.DeserializeAsync<CancelExifsInput>();
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> GetItemsFinished(IRequest request)
    {
        var data = await request.DeserializeAsync<GetItemsFinishedInput>();
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> GetAccentColor(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
        var color = Theme.GetAccentColor();
        await request.SendJsonAsync(new GetAccentColorResponse(color));
        return true;
    }

    public static async Task<bool> CloseWindow(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
#if Windows        
        Form.Close();
#endif        
        return true;
    }

    public static async Task<bool> Maximize(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
#if Windows        
        Form.Maximize();
#endif        
        return true;
    }

    public static async Task<bool> Minimize(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
#if Windows        
        Form.Minimize();
#endif        
        return true;
    }
        
    public static async Task<bool> Restore(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
#if Windows        
        Form.Restore();
#endif        
        return true;
    }

    public static async Task<bool> Cmd(IRequest request)
    {
        var cmd = await request.DeserializeAsync<Command>();
        switch (cmd?.Cmd)
        {
            case "SHOW_DEV_TOOLS":
            #if Windows
                Commands.ShowDevTools();
            #endif
                break;
        }

        return true;
    }

    public static async Task<bool> GetIconFromName(IRequest request)
    {
        var subPath = request.SubPath;
        if (subPath == null)
            return false;
        var payload = await Icon.GetAsync(subPath);
        await request.SendAsync(payload, payload.IsSvg() ? "image/svg+xml" : "image/png");
        return true;
    }

    public static async Task<bool> GetIconFromExtension(IRequest request)
    {
        var subPath = request.SubPath;
        if (subPath == null)
            return false;
        var payload = await Icon.GetAsync($"ext:{subPath}");
        await request.SendAsync(payload, payload.IsSvg() ? "image/svg+xml" : "image/png");
        return true;
    }
    
    public static async Task OnPostError(Exception e, IRequest request)
    {
        try
        {
            throw e;
        }
        catch (DirectoryNotFoundException)
        {
            await request.SendJsonAsync(new SystemError(ErrorType.PathNotFound, "Datei oder Verzeichnis nicht gefunden"));
        }
        catch (UnauthorizedAccessException)
        {
            await request.SendJsonAsync(new SystemError(ErrorType.AccessDenied, "Keine Berechtigung"));
        }
    }
    
    public static void SendJson(CommanderEvent evt) => websocketChannel.Writer.TryWrite(evt);

    public static void WebSocket(IWebSocket webSocket)
        => socket = webSocket;

    static async Task StartChannelProcessing()
    {
        await foreach (var job in websocketChannel.Reader.ReadAllAsync())
            await (socket?.SendJson(job) ?? Task.CompletedTask);
    }

    static Requests() => channelTask = StartChannelProcessing();

    static readonly Channel<CommanderEvent> websocketChannel
        = Channel.CreateUnbounded<CommanderEvent>(new() { SingleReader = true });
    static readonly Task channelTask;
    static IWebSocket? socket;
}

class EventCmd
{
    public const string Exif = "Exif";
    public const string ExifStart = "ExifStart";
    public const string ExifStop = "ExifStop";
    public const string CopyProgress = "CopyProgress";
    public const string CopyStop = "CopyStop";
    public const string CopyProgressShowDialog = "CopyProgressShowDialog";
    public const string VersionsStart = "VersionsStart";
    public const string VersionsStop = "VersionsStop";
    public const string Versions = "Versions";
    public const string ThemeChanged = "ThemeChanged";
    public const string DeleteProgress = "DeleteProgress";
    public const string DeleteStop = "DeleteStop";
    public const string WindowState = "WindowState";
    public const string ShowHidden = "ShowHidden";
}

record EventData(string? AccentColor = null, bool? Maximized = null, bool? ShowHidden = null);

record CommanderEvent(string? FolderId, string Cmd, EventData Msg);

record Command(string Cmd);

