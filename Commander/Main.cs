using System.Drawing;
using WebWindowNetCore;
using WebServerLight;
using WebServerLight.Routing;
using System.Diagnostics;






var psi = new ProcessStartInfo
{
    FileName = "Native/icon", // exe or command
    Arguments = "",                         // add args if needed
    RedirectStandardInput = true,
    RedirectStandardOutput = true,
    RedirectStandardError = true,
    UseShellExecute = false,
    CreateNoWindow = true
};

var proc = Process.Start(psi);
// if (proc == null)
// {
//     Console.Error.WriteLine("Failed to start"); 
//     return -1; 
// }

var stderrTask = proc.StandardError.ReadToEndAsync();
var outStream = proc.StandardOutput.BaseStream;
var inWriter = proc.StandardInput;

// Example: send 3 names, reading a response after each
string[] names = { "network-server", "drive-removable-media", "network-server", "starred", "user-home", "media-removable", "folder-open" };
foreach (var name in names)
{
    var stopwatch = new Stopwatch();
    stopwatch.Start();

    await inWriter.WriteLineAsync(name);
    await inWriter.FlushAsync();

    // Read 8-byte length header
    var lenBuf = new byte[8];
    var read = 0;
    while (read < 8)
    {
        var n = await outStream.ReadAsync(lenBuf, read, 8 - read);
        if (n == 0)
            throw new EndOfStreamException("Child closed stdout while reading header");
        read += n;
    }
    var payloadLen = BitConverter.ToUInt64(lenBuf, 0);

    // Read payloadLen bytes
    byte[] payload = new byte[payloadLen];
    int received = 0;
    while (received < (int)payloadLen)
    {
        int n = await outStream.ReadAsync(payload, received, (int)payloadLen - received);
        if (n == 0)
            throw new EndOfStreamException("Child closed stdout while reading payload");
        received += n;
    }
    Console.WriteLine($"Dauerte: {stopwatch.Elapsed.TotalMilliseconds}");

    using var feile = File.OpenWrite($"Feile-{name}.png");
    feile.Write(payload);
}

// Close stdin to tell child no more input (optional)
proc.StandardInput.Close();

await proc.WaitForExitAsync();
string stderr = await stderrTask;
if (!string.IsNullOrEmpty(stderr)) 
    Console.Error.WriteLine(stderr);



























var webView = WebView
    .Create()
    .AppId("de.uriegel.commander")
    .Title("Commander")
    .InitialBounds(600, 800)
    .SaveBounds()
    .DevTools()
    .BackgroundColor(Color.Transparent)
    //.DefaultContextMenuDisabled()
#if Windows
    .ResourceIcon("icon")
#endif
    .DebugUrl("http://localhost:5173/")
    .Url("https://github.com")
    .CanClose(() => true);

var server =
    WebServer
        .New()
        .Http(8080)
        //.WebsiteFromResource()
        .AddAllowedOrigin("http://localhost:5173")
        .Route(MethodRoute
            .New(Method.Post)
                .Add(PathRoute.New("/requests/getdrives").Request(Requests.GetDrives))
                .Add(PathRoute.New("/requests/cancelexifs").Request(Requests.CancelExifs))
                .Add(PathRoute.New("/requests/getitemsfinished").Request(Requests.GetItemsFinished))
                .Add(PathRoute.New("/requests/getaccentcolor").Request(Requests.GetAccentColor))
            )
        .Route(MethodRoute
            .New(Method.Get)
                .Add(PathRoute.New("/icon")).Request(Requests.GetIcon))
        .WebSocket(Requests.WebSocket)
        .Build();

Gtk.StartThemeChangeDetecting();
server.Start();
webView.Run();
server.Stop();    


