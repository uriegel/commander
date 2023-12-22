#if Windows
using AspNetExtensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using CsTools.Functional;
using CsTools.Extensions;

using static CsTools.Core;

static class UacServer
{
    public static async Task Run(int commanderId)
    {
        processRunning = new TaskCompletionSource();
        await Start();
        await Task.WhenAny([
            Process.GetProcessById(commanderId).WaitForExitAsync(),
            processRunning.Task
        ]);
    }

    public static void Exit() => processRunning?.TrySetResult();

    public static Result<Nothing, Nothing> StartElevated()
        => Try<Result<Nothing, Nothing>>(() => new Process()
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
        .Start()
            ? Ok<Nothing, Nothing>(nothing)
            : Error<Nothing, Nothing>(nothing),
        e => 
            (uint)e.HResult == 0x80004005
            ? Error<Nothing, Nothing>(nothing)
            : throw e);

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
            .WithJsonPost<RenameItemParam, Nothing, RequestError>("commander/renameitem", Directory.RenameItemUac, e => Exit())
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

    static TaskCompletionSource? processRunning; 
}

record StartElevatedResult(bool Ok);
#endif