using CsTools;
using CsTools.Extensions;
using WebServerLight;

static class Events
{
    public static void Create(IWebSocket socket)
    {
        Events.socket?.Close();
        Events.socket = socket;
        Console.WriteLine($"Event source created: {socket.Url}");
    }

    public static Action<string> MenuAction { get; } = menuAction => Send(new(EventType.MenuAction, menuAction, null));
    public static Action<bool> PreviewAction { get; } = preview => Send(new(EventType.PreviewAction, null, preview));

    static async void Send(Event evt)
    {
        try
        {
            await (socket?.SendJson(evt) ?? Unit.Value.ToAsync());
        }
        catch { }
    }

    static IWebSocket? socket;
}

enum EventType
{
    MenuAction,
    PreviewAction
}

record Event(EventType EventType, string? MenuAction, bool? PreviewOn);

