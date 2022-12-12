module AndroidProxy

open Giraffe
open Microsoft.AspNetCore.Http
open System
open System.Collections.Generic
open System.Linq
open Microsoft.Extensions.Primitives
open System.Net.Http
open FSharpTools.Functional

let private initGetClient () = 
    new HttpClient()

let getClient = memoizeSingle initGetClient

let getImage (next: HttpFunc) (ctx: HttpContext) =
    let httpClient = getClient ()
    // httpClient.DefaultRequestHeaders.CacheControl <- CacheControlHeaderValue(NoCache = false)

    let createTargetMessage () = 
        let param = 
            ctx.Request.Query.Item("path").First() 
            |> Android.getRequestParam

        let buildTargetUri () = 
            sprintf "%s%s" param.BaseUrl param.FilePath
            |> Uri 
        
        let getMethod () = 
            match ctx.Request.Method with
            | m when HttpMethods.IsDelete(m)  -> HttpMethod.Delete
            | m when HttpMethods.IsGet(m)     -> HttpMethod.Get
            | m when HttpMethods.IsHead(m)    -> HttpMethod.Head
            | m when HttpMethods.IsOptions(m) -> HttpMethod.Options
            | m when HttpMethods.IsPost(m)    -> HttpMethod.Post
            | m when HttpMethods.IsPut(m)     -> HttpMethod.Put
            | m when HttpMethods.IsTrace(m)   -> HttpMethod.Trace
            | _                                        -> HttpMethod.Get

        let requestMessage = new HttpRequestMessage(getMethod (), buildTargetUri ())

        let addHeader (header: KeyValuePair<string, StringValues>) =
            requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()) 
            |> ignore

        ctx.Request.Headers
        |> Seq.iter addHeader
        
        if requestMessage.Method = HttpMethod.Post 
        || requestMessage.Method = HttpMethod.Put 
        || requestMessage.Method = HttpMethod.Options then
            requestMessage.Content <- new StreamContent(ctx.Request.Body)
            let addHeader (header: KeyValuePair<string, StringValues>) =
                requestMessage.Content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()) 
                |> ignore
            ctx.Request.Headers
            |> Seq.iter addHeader

        requestMessage.Headers.Host <- requestMessage.RequestUri.Host
        requestMessage
    task {
        let copyFromTargetResponseHeaders (responseMessage: HttpResponseMessage) =
              
            responseMessage.Headers
            |> Seq.iter (fun header -> ctx.Response.Headers[header.Key] <- header.Value.ToArray())

            responseMessage.Content.Headers
            |> Seq.iter (fun header ->  ctx.Response.Headers[header.Key] <- header.Value.ToArray())

            ctx.Response.Headers.Remove("transfer-encoding") |> ignore

        use msg = createTargetMessage ()
        use! responseMessage = httpClient.SendAsync(msg, HttpCompletionOption.ResponseHeadersRead, ctx.RequestAborted) 
        copyFromTargetResponseHeaders responseMessage
        ctx.Response.StatusCode <- LanguagePrimitives.EnumToValue responseMessage.StatusCode
        do! responseMessage.Content.CopyToAsync(ctx.Response.Body) 
        return Some ctx
    }
   

