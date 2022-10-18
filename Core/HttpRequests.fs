module HttpRequests

open System
open System.Linq
open System.Net.Http
open System.Net.Http.Json
open Configuration
open System.Threading
open FSharpTools.Functional
open System.IO
open System.Net
open FSharpRailway.Option

type RequestClient = {
    Client: HttpClient
    GetUri: string->Uri
}

let private initGetClient basePath = 
    {
        Client = new HttpClient()
        GetUri = (fun subPath -> Uri(sprintf "%s/%s" basePath subPath))
    }   

let getClient = memoize initGetClient

let post<'a> requestClient url data = task {
    use requestMessage = new HttpRequestMessage(HttpMethod.Post, requestClient.GetUri(url))
    requestMessage.Content <- JsonContent.Create(data, data.GetType (), null, getJsonOptions ()) 
    use! responseMessage = requestClient.Client.SendAsync(requestMessage) 
    return! responseMessage.Content.ReadFromJsonAsync<'a>(getJsonOptions (), CancellationToken.None) 
} 

let getHeader (headers: Headers.HttpResponseHeaders) (header: string) = 
    match headers.TryGetValues("x-file-date") with
    | true, values -> Some (values.FirstOrDefault () )
    | _   , _      -> None

let getLastWriteTime = 

    let getFileDateValue (responseMessage: HttpResponseMessage) = getHeader responseMessage.Headers "x-file-date" 

    let tryParse (numberString: string) =         
        match Int64.TryParse numberString with
        | true, num -> Some num
        | _, _ -> None

    let fromUnixTime dt = dt |> DateTimeOffset.FromUnixTimeMilliseconds  
    let toLocalTime (dt: DateTimeOffset) = dt.LocalDateTime
    let getTime = fromUnixTime >> toLocalTime
   
    getFileDateValue >=> tryParse >=> (fun n -> Some (getTime n))


let saveFile<'a> requestClient url data = 
    use requestMessage = new HttpRequestMessage(HttpMethod.Post, requestClient.GetUri(url))
    requestMessage.Content <- JsonContent.Create(data, data.GetType (), null, getJsonOptions ()) 
    use responseMessage = requestClient.Client.Send requestMessage 
    let stream = responseMessage.Content.ReadAsStream() 

    use target = File.Create "/home/uwe/test/test.jpg"
    stream.CopyTo target

    let setLastWriteTime path time = File.SetLastWriteTime (path, time)
    getLastWriteTime responseMessage
    |> Option.iter (setLastWriteTime "/home/uwe/test/test.jpg")

        


