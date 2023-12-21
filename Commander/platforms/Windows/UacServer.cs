#if Windows
using AspNetExtensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using CsTools.Functional;
using System.Windows.Forms;
using CsTools.Extensions;

static class UacServer
{
    public static async Task Run(int commanderId)
    {
        MessageBox.Show($"Das nbin ich {commanderId}");
        await Start();
        await Process.GetProcessById(commanderId).WaitForExitAsync();
    }

    public static bool StartElevated()
        => new Process()
        {
            StartInfo = new ProcessStartInfo(Process.GetCurrentProcess()?.MainModule?.FileName ?? "")
#if DEBUG            
            {
                Arguments = $"{Environment.CurrentDirectory.AppendPath(@"Commander\bin\Debug\net8.0-windows\win-x64\commander.dll")} -adminMode {Environment.ProcessId}",
                Verb = "runas",
                UseShellExecute = true
            }
#else       
            {
                Arguments = "-adminMode {Process.GetCurrentProcess().Id}",
                Verb = "runas",
                UseShellExecute = true
            }
#endif
        }
        .Start();

    static Task Start()
        => WebApplication
            .CreateBuilder()
            .ConfigureWebHost(webHostBuilder => 
                webHostBuilder
                    .ConfigureKestrel(options => options.ListenLocalhost(21000))
                    .ConfigureServices(services =>
                        services
                            .AddCors()
                            .AddResponseCompression())
                    .ConfigureLogging(builder =>
                        builder
                            .AddFilter(a => a == LogLevel.Warning)
                            .AddConsole()
                            .AddDebug()))
            .Build()
            .WithResponseCompression()
            .WithCors(builder =>
                builder
                    .WithOrigins("http://localhost:20000")
                    .AllowAnyHeader()
                    .AllowAnyMethod())
            .WithRouting()
            .WithSse("commander/sse", Events.Source)
            // .JsonPost<DeleteItemsParam, IOResult>("commander/deleteitems", Directory.DeleteItems)
            // .JsonPost<CreateFolderParam, IOResult>("commander/createfolder", Directory.CreateFolder)
            .WithJsonPost<RenameItemParam, Nothing, RequestError>("commander/renameitem", Directory.RenameItem)
            // TODO
            // .JsonPost<CopyItemsParam, IOResult>("commander/copyitems", Directory.CopyItems)
            // .JsonPost<Empty, IOResult>("commander/cancelcopy", Directory.CancelCopy)
            // .JsonPost<StartServicesParam, IOResult>("commander/startservices", Services.Start)            
            // .JsonPost<StartServicesParam, IOResult>("commander/stopservices", Services.Stop)            
            .StartAsync();

    // static WebApplication UseSse<T>(this WebApplication app, string path, SseEventSource<T> sseEventSource)
    //     => app.SideEffect(n => 
    //             RequestDelegates = RequestDelegates.Append(
    //                 (WebApplication app) =>
    //                     app.WithMapGet(path, (HttpContext context) => new Sse<T>(sseEventSource.Subject).Start(context)))
    //                         .ToArray());
}

record StartElevatedResult(bool Ok);
#endif