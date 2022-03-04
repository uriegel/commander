module Server 

open Giraffe
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.Server.Kestrel.Core
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging

open Configuration

let configureServices (services : IServiceCollection) = 
    
    services
        .AddSingleton(getJsonOptions ()) 
        .AddSingleton<Json.ISerializer, SystemTextJson.Serializer>() 
        .AddGiraffe()
        |> ignore

let configureKestrel (options: KestrelServerOptions) = 
    options.ListenAnyIP 9865

let configureLogging (builder : ILoggingBuilder) =
    // Set a logging filter (optional)
    let filter l = l.Equals LogLevel.Warning

    // Configure the logging factory
    builder.AddFilter(filter) // Optional filter
           .AddConsole()      // Set up the Console logger
           .AddDebug()        // Set up the Debug logger

           // Add additional loggers if wanted...
    |> ignore

let webHostBuilder (webHostBuilder: IWebHostBuilder) = 
    webHostBuilder
        .ConfigureKestrel(configureKestrel)
        .Configure(Routes.configure)
        .ConfigureServices(configureServices)
        .ConfigureLogging(configureLogging)
        |> ignore

let start () = 
    Host.CreateDefaultBuilder()
        .ConfigureWebHostDefaults(webHostBuilder)
        .Build()
        .Start()
