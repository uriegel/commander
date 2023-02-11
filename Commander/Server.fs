module Server 

open Giraffe
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.Server.Kestrel.Core
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.Logging
open System

open Configuration

let mutable private port = 0 

let configureServices (services : IServiceCollection) = 
    
    services
        .AddCors()
        .AddSingleton(getJsonOptions ()) 
        .AddSingleton<Json.ISerializer, SystemTextJson.Serializer>() 
        .AddResponseCompression()
        .AddGiraffe()
        |> ignore

let configureKestrel (options: KestrelServerOptions) = 
    options.ListenAnyIP port

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
        .UseContentRoot("/home/uwe/commander-test")
        .UseWebRoot("build")
        .ConfigureKestrel(configureKestrel)
        .Configure(Routes.configure)
        .ConfigureServices(configureServices)
        .ConfigureLogging(configureLogging)
        |> ignore

let start listenerPort = 
    port <- listenerPort
    Host.CreateDefaultBuilder()
        .ConfigureWebHostDefaults(webHostBuilder)
        .Build()    
        .Start()
