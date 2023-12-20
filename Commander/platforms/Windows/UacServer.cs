#if Windows
using AspNetExtensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using CsTools.Extensions;
using CsTools.Functional;

using static CsTools.Core;

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
            .UseSse("commander/sse", Events.Source)
            .JsonPost<DeleteItemsParam, IOResult>("commander/deleteitems", Directory.DeleteItems)
            .JsonPost<CreateFolderParam, IOResult>("commander/createfolder", Directory.CreateFolder)
            .JsonPost<RenameItemParam, Nothing, Error>("commander/renameitem", Directory.RenameItem)
            // TODO
            // .JsonPost<CopyItemsParam, IOResult>("commander/copyitems", Directory.CopyItems)
            // .JsonPost<Empty, IOResult>("commander/cancelcopy", Directory.CancelCopy)
            .JsonPost<StartServicesParam, IOResult>("commander/startservices", Services.Start)            
            .JsonPost<StartServicesParam, IOResult>("commander/stopservices", Services.Stop)            
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

    static WebApplication JsonPost<T, TR, TE>(this WebApplication app, string path, Func<T, AsyncResult<TR, TE>> onRequest)
            where TR : notnull
            where TE : RequestError
        => app.SideEffect(n =>
                RequestDelegates = RequestDelegates.Append(
                    (WebApplication app) =>
                        app.WithMapPost(path, async context =>
                            {
                                try
                                {
                                    if (context.Request.ContentLength == 0)
                                        await context.Response.WriteAsJsonAsync(Error<TR, RequestError>(new RequestError(2002, "Wrongly called without parameters")));
                                    else 
                                    {
                                        var param = await context.Request.ReadFromJsonAsync<T>();
                                        await context.Response.WriteAsJsonAsync(await onRequest(param!).ToResult());
                                    }
                                }
                                catch (Exception e)
                                {
                                    await context.Response.WriteAsJsonAsync(Error<TR, RequestError>(new RequestError(2000, e.Message)));
                                }
                            }))
                            .ToArray());

    static WebApplication UseSse<T>(this WebApplication app, string path, SseEventSource<T> sseEventSource)
        => app.SideEffect(n => 
                RequestDelegates = RequestDelegates.Append(
                    (WebApplication app) =>
                        app.WithMapGet(path, (HttpContext context) => new Sse<T>(sseEventSource.Subject).Start(context)))
                            .ToArray());

    static Func<WebApplication, WebApplication>[] RequestDelegates = Array.Empty<Func<WebApplication, WebApplication>>();
}

record StartElevatedResult(bool Ok);
#endif