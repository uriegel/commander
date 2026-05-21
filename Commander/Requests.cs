using System.Threading.Channels;
using WebServerLight;

using CsTools.Extensions;

static class Requests
{
    public static async Task<bool> GetDrives(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
        var drives = await Drive.Get();
        var response = new GetRootItemsOutput(drives, "root", 0, drives.Length);
        await request.SendJsonAsync(response);
        return true;
    }

    public static async Task<bool> GetFiles(IRequest request)
    {
        var getFiles = await request.DeserializeAsync<GetFilesInput>();
        var response = Directory.GetFiles(getFiles!);
        await request.SendJsonAsync(response);
        return true;
    }

    public static async Task<bool> GetRemoteFiles(IRequest request)
    {
        var getFiles = await request.DeserializeAsync<GetFilesInput>();
        var response = await Remotes.GetFiles(getFiles!);
        await request.SendJsonAsync(response);
        return true;
    }

    public static async Task<bool> CreateRemoteFolder(IRequest request)
    {
        var input = await request.DeserializeAsync<CreateRemoteFolderInput>();
        await Remotes.CreateFolder(input!);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> RemoteDelete(IRequest request)
    {
        var input = await request.DeserializeAsync<DeleteInput>();
        await Remotes.DeleteItems(input!);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> CopyFromRemote(IRequest request)
    {
        var input = await request.DeserializeAsync<CopyInput>();
        if (input != null)
            await BackgroundJobs.AddJobAsync(input, JobType.CopyFromRemote);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> CopyToRemote(IRequest request)
    {
        var input = await request.DeserializeAsync<CopyInput>();
        if (input != null)
            await BackgroundJobs.AddJobAsync(input, JobType.CopyToRemote);
        await request.SendJsonAsync(new NullData());
        return true;
    }
                
    public static async Task<bool> GetItemsFinished(IRequest request)
    {
        var data = await request.DeserializeAsync<GetItemsFinishedInput>();
        Directory.Get(data?.FolderId)?.GetItemsFinished(data?.FolderId ?? "");    
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> Mount(IRequest request)
    {
        var data = await request.DeserializeAsync<MountInput>();
        var path = await Drive.Mount(data?.Device ?? "");
        await request.SendJsonAsync(new MountOutput(path));
        return true;
    }

    public static async Task<bool> GetAccentColor(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
        var color = Theme.GetAccentColor();
        await request.SendJsonAsync(new GetAccentColorOutput(color));
        return true;
    }

    public static async Task<bool> CloseWindow(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
#if Windows        
        Form.Close();
#endif        
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> Maximize(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
#if Windows
        Form.Maximize();
#endif
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> Minimize(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
#if Windows
        Form.Minimize();
#endif
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> Restore(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
#if Windows        
        Form.Restore();
#endif        
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> Cmd(IRequest request)
    {
        var cmd = await request.DeserializeAsync<CmdInput>();
        switch (cmd?.Cmd)
        {
            case "SHOW_DEV_TOOLS":
#if Windows
                Commands.ShowDevTools();
#endif
                break;
        }

        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> CreateFolder(IRequest request)
    {
        var input = await request.DeserializeAsync<CreateFolderInput>();
        await Directory.CreateFolder(input!.Item, input.Path);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> DeleteItems(IRequest request)
    {
        var input = await request.DeserializeAsync<DeleteInput>();
        await Directory.DeleteItems(input!.Items, input.Path);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> FlattenItems(IRequest request)
    {
        var input = await request.DeserializeAsync<FlattenItemsInput>();
        var result = Directory.FlattenItems(input!);
        await request.SendJsonAsync(result);
        return true;
    }

    public static async Task<bool> Copy(IRequest request)
    {
        var input = await request.DeserializeAsync<CopyInput>();
        await Directory.CopyAsync(input!);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> OnEnter(IRequest request)
    {
        var input = await request.DeserializeAsync<OnEnterInput>();
        await Directory.OnEnter(input!);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> GetRecommendedApps(IRequest request)
    {
        var input = await request.DeserializeAsync<GetRecommendedAppsInput>();
        var apps = Directory.GetRecommendedApps(input?.File);
        await request.SendJsonAsync(apps);
        return true;
    }

    public static async Task<bool> GetAllApps(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
        var apps = Directory.GetAllApps();
        await request.SendJsonAsync(apps);
        return true;
    }

    public static async Task<bool> OpenFile(IRequest request)
    {
        var input = await request.DeserializeAsync<OpenFileInput>();
        if (input != null)
            Directory.OpenFile(input.Executable, input.File);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> Rename(IRequest request)
    {
        var input = await request.DeserializeAsync<RenameInput>();
        if (input != null)
            await Directory.Rename(input); 
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> ExtendedRename(IRequest request)
    {
        var input = await request.DeserializeAsync<ExtendedRenameInput>();
        if (input != null)
            Directory.ExtendedRename(input);
        await request.SendJsonAsync(new ExtendedRenameOutput(true));
        return true;
    }

    public static async Task<bool> AddNetworkShare(IRequest request)
    {
        var input = await request.DeserializeAsync<AddNetworkShareInput>();
        if (input != null)
            Directory.AddNetworkShare(input);
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> ExtendCopyItems(IRequest request)
    {
        var input = await request.DeserializeAsync<ExtendCopyItemsInput>();
        var res = input != null
            ? Directory.ExtendCopyItems(input.Items)
            : [];
        await request.SendJsonAsync(res);
        return true;
    }
    
    public static async Task<bool> GetIconFromName(IRequest request)
    {
        var subPath = request.SubPath;
        if (subPath == null)
            return true;
        var payload = await Icon.GetAsync(subPath);
        if (payload.Length == 0)
            payload = await Icon.GetAsync("res=32application-x-executable");
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

    public static async Task<bool> GetFile(IRequest request)
    {
        var subPath = request.SubPath;
        if (subPath == null)
            return false;
        using var stream = File.OpenRead(Directory.GetFilePath(subPath));

        await request.SendAsync(stream, stream.Length, subPath?.GetFileExtension()?.ToMimeType() ?? "text/plain");
        return true;
    }

    public static async Task<bool> GetTrack(IRequest request)
    {
        var subPath = request.SubPath;
        if (subPath == null)
            return false;
        var track = TrackInfo.Get(Directory.GetFilePath(subPath));
        await request.SendJsonAsync(track);
        return true;
    }

    public static async Task OnPostError(Exception e, IRequest request)
    {
        if (Globals.CheckPlatformException(e) is SystemError se)
            await request.SendJsonAsync(se);
        else if (e is AlreadyMountedException)
            await request.SendJsonAsync(new SystemError(ErrorType.Unknown, "Bereits eingehangen"));
        else if (e is MountException me)
            await request.SendJsonAsync(new SystemError(ErrorType.Unknown, me.Message));
        else if (e is DirectoryNotFoundException)
            await request.SendJsonAsync(new SystemError(ErrorType.PathNotFound, "Datei oder Verzeichnis nicht gefunden"));
        else if (e is UnauthorizedAccessException)
            await request.SendJsonAsync(new SystemError(ErrorType.AccessDenied, "Keine Berechtigung"));
        else if (e is NotMountedException)
            await request.SendJsonAsync(new SystemError(ErrorType.NotMounted, "Nicht eingehangen"));
        else if (e is NetworknameNotFoundException)
            await request.SendJsonAsync(new SystemError(ErrorType.NetNameNotFound, "Netzwerkname nicht gefunden"));
        else if (e is WrongCredentialsException)
            await request.SendJsonAsync(new SystemError(ErrorType.WrongCredentials, "Falsche Anmeldedaten"));
        else    
            await request.SendJsonAsync(new SystemError(ErrorType.Unknown, e.Message)); 
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




