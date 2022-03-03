module Server 

open Giraffe
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.Server.Kestrel.Core
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open System
open System.Text.Json

let configureServices (services : IServiceCollection) = 
    let jsonOptions = JsonSerializerOptions()
    // TODO FSharpUtils
    //jsonOptions.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
//    jsonOptions.Converters.Add(JsonFSharpConverter())
    services
        .AddGiraffe()
        //.AddSingleton(jsonOptions) 
        //.AddSingleton<Json.ISerializer, SystemTextJson.Serializer>() 
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
