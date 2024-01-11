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
using CsTools.HttpRequest;

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

    public static async void Exit() 
    {
        await Task.Delay(100);
        processRunning?.TrySetResult();
    }

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
                Arguments = $"-adminMode {Environment.ProcessId}",
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
            .WithJsonPost<DeleteItemsParam, Nothing, RequestError>("commander/deleteitems", Directory.DeleteItems, _ => Exit())
            .WithJsonPost<CreateFolderParam, Nothing, RequestError>("commander/createfolder", Directory.CreateFolder, _ => Exit())
            .WithJsonPost<RenameItemParam, Nothing, RequestError>("commander/renameitem", Directory.RenameItemUac, _ => Exit())
            .WithJsonPost<UacCopyItemsParam, Nothing, RequestError>("commander/copyitems", CopyProcessor.CopyUac, _ => Exit())
            .WithJsonPost<Nothing, Nothing, RequestError>("commander/cancelcopy", CopyProcessor.Cancel)
            // .JsonPost<StartServicesParam, IOResult>("commander/startservices", Services.Start)            
            // .JsonPost<StartServicesParam, IOResult>("commander/stopservices", Services.Stop)            
            .StartAsync();

    static TaskCompletionSource? processRunning; 
}

record StartElevatedResult(bool Ok);
#endif