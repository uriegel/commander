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

// TODO
/*
let init () = 
    let startAsAdmin () = 
        let exe = Assembly.GetEntryAssembly().Location.Replace(".dll", ".exe")
        let info = new ProcessStartInfo (exe)
        info.Arguments <- "-adminMode"
        info.Verb <- "runas"
        info.UseShellExecute <- true
        let proc = new Process ()
        proc.StartInfo <- info 
        try 
            proc.Start () |> ignore
        with
        | _ -> ()
 
    let args = Environment.GetCommandLineArgs ()
    match args.Length > 1 && args[1] = "-adminMode" with
    | true  -> 
        (20001, false)
    | false -> 
        if MessageBox(IntPtr.Zero, "Möchtest Du auch Aktionen mit Administratorrechten ausführen?\n\nEs erscheinen immer Admin-Abfragen bei Bedarf", "Commander", 0x21u) = 1 then
            startAsAdmin ()
        (20000, true)
*/