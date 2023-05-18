using AspNetExtensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using LinqTools;
using Microsoft.AspNetCore.Http;

static class UacServer
{
    public static void Run()
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
                    .WithOrigins("http://localhost:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod())
#endif                                        
            .WithRouting()
            .JsonPost<DeleteItemsParam, IOResult>("commander/deleteitems", Directory.DeleteItems)
            .With(RequestDelegates)
            .Run();

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