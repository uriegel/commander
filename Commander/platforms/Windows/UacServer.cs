using AspNetExtensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using LinqTools;
using Microsoft.AspNetCore.Http;

static class UacServer
{
    public static async Task Run(int commanderId)
    {
        await Start();
        await Process.GetProcessById(commanderId).WaitForExitAsync();
    }

    public static async Task StartElevated(HttpContext context)
	{
        var exe = Process.GetCurrentProcess()?.MainModule?.FileName;
        var ok = new Process()
        {
            StartInfo = new ProcessStartInfo(exe!)
            {
                Arguments = $"-adminMode {Process.GetCurrentProcess().Id}",
                Verb = "runas",
                UseShellExecute = true
            }
        }.Start();
      
        await context.Response.WriteAsJsonAsync<StartElevatedResult>(new(ok));
    }

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
            .JsonPost<DeleteItemsParam, IOResult>("commander/deleteitems", Directory.DeleteItems)
            .JsonPost<CreateFolderParam, IOResult>("commander/createfolder", Directory.CreateFolder)
            .JsonPost<RenameItemParam, IOResult>("commander/renameitem", Directory.RenameItem)
            .With(RequestDelegates)
            .StartAsync();

    static WebApplication JsonPost<T, TResult>(this WebApplication app, string path, Func<T, Task<TResult>> onRequest)
        => app.SideEffect(n => 
                RequestDelegates = RequestDelegates.Append(
                    (WebApplication app) =>
                        app.WithMapPost(path, async (HttpContext context) => 
                            {
                                var param = await context.Request.ReadFromJsonAsync<T>();
                                await context.Response.WriteAsJsonAsync<TResult>(await onRequest(param!));
                            }))
                            .ToArray());

    static Func<WebApplication, WebApplication>[] RequestDelegates = Array.Empty<Func<WebApplication, WebApplication>>();
}

record StartElevatedResult(bool Ok);