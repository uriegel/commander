open Giraffe
open FSharpTools
open FSharpTools.Functional
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.Http
open Microsoft.AspNetCore.Server.Kestrel.Core
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Logging
open System
open System.Text.Json

let tee f x = 
    f x
    x
let takeFirstTupleElem (a, _) = a
let combine2Pathes path1 path2 = IO.Path.Combine (path1, path2)
let combine3Pathes path1 path2 path3 = IO.Path.Combine (path1, path2, path3)
let retrieveConfigDirectory application = combine3Pathes (Environment.GetFolderPath Environment.SpecialFolder.ApplicationData) "uriegel.de" application
let getConfigDirectory = memoize retrieveConfigDirectory
let getElectronFile = combine3Pathes (getConfigDirectory "commander") "electron" 
    
let openStream path : IO.Stream = IO.File.OpenWrite path
let checkDirectory path = 
    let info = IO.FileInfo path
    if not info.Directory.Exists then 
        IO.Directory.CreateDirectory info.DirectoryName |> ignore
    path
let securedOpenStream = checkDirectory >> openStream
let copyStream (target: IO.Stream, source: IO.Stream) = 
    source.CopyTo target
    source.Flush ()
    target.Close ()

let getResource resourcePath = 
    let assembly = Reflection.Assembly.GetEntryAssembly ()
    assembly.GetManifestResourceStream resourcePath

let getFileAndResourceStreams (getFileStream: string->IO.Stream) (getResourceStream: string->IO.Stream) (filePath, resourcePath) =
    (getFileStream filePath, getResourceStream resourcePath)

let saveResource = tee (getFileAndResourceStreams securedOpenStream getResource >> copyStream) >> takeFirstTupleElem

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

let configureRoutes (app : IApplicationBuilder) = 
    let routes =
        choose [  
            route "/foo"  >=> text "Foo"
        ]       
    app.UseGiraffe routes      

let webHostBuilder (webHostBuilder: IWebHostBuilder) = 
    webHostBuilder
        .ConfigureKestrel(configureKestrel)
        .Configure(configureRoutes)
        .ConfigureServices(configureServices)
        .ConfigureLogging(configureLogging)
        |> ignore

Host.CreateDefaultBuilder()
    .ConfigureWebHostDefaults(webHostBuilder)
    .Build()
    .Start()

async {
    do! Electron.start <| saveResource (getElectronFile "main.js", "electron/main.js")
} |> Async.RunSynchronously

//TODO index and css and styles in Resource, served by Giraffe
//TODO Start electron with environment x=23 y=45 w=234 h=234 isMaximized
//TODO typescript renderer script



