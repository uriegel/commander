using AspNetExtensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using LinqTools;
using Microsoft.AspNetCore.Http;
using CsTools.HttpRequest;

using static CsTools.HttpRequest.Core;

static class UacServer
{
    public static async Task Run()
    {
        await Start();
        await Request.GetStringAsync(DefaultSettings with
        {
            BaseUrl = $"http://localhost:20000",
            Url = "/commander/waitonexit",
        });
    }

    public static async Task StartElevated(HttpContext context)
	{
        var exe = Process.GetCurrentProcess()?.MainModule?.FileName;
        new Process()
        {
            StartInfo = new ProcessStartInfo(exe!)
            {
                Arguments = "-adminMode",
                Verb = "runas",
                UseShellExecute = true
            }
        }.Start();
      
        await context.Response.WriteAsJsonAsync<Empty>(new());
    }

    static Task Start()
        => WebApplication
            .CreateBuilder()
            .ConfigureWebHost(webHostBuilder => 
                webHostBuilder
                    .ConfigureKestrel(options => options.ListenLocalhost(21000))
                    .ConfigureServices(services =>
                        services
#if DEBUG                                
                            .AddCors()
#endif                            
                            .AddResponseCompression())
                    .ConfigureLogging(builder =>
                        builder
                            .AddFilter(a => a == LogLevel.Warning)
                            .AddConsole()
                            .AddDebug()))
            .Build()
            .WithResponseCompression()
#if DEBUG                                            
            .WithCors(builder =>
                builder
                    .WithOrigins("http://localhost:20000")
                    .AllowAnyHeader()
                    .AllowAnyMethod())
#endif                                        
            .WithRouting()
            .JsonPost<DeleteItemsParam, IOResult>("commander/deleteitems", Directory.DeleteItems)
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

