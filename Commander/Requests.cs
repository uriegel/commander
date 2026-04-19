
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

    public static async Task<bool> CancelExifs(IRequest request)
    {
        var data = await request.DeserializeAsync<CancelExifs>();
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> GetItemsFinished(IRequest request)
    {
        var data = await request.DeserializeAsync<GetItemsFinished>();
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> GetAccentColor(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
        var color = Gtk.GetAccentColor();
        await request.SendJsonAsync(new GetAccentColor(color));
        return true;
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

record FileItem();

record GetDrives(string FolderId, string RequestId, string Path, bool ShowHidden);
record CancelExifs(string RequestId);
record NullData();
record GetItemsFinished(string FolderId);
record GetAccentColor(string Color);

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
}

record EventData(string? AccentColor)
{
    public EventData() : this((string?)null) {  }
};

record CommanderEvent(string? FolderId, string Cmd, EventData Msg);

