module HttpRequests

open System
open System.Linq
open System.Net.Http
open System.Net.Http.Json
open Configuration
open System.Threading
open FSharpTools.Functional
open System.IO
open FSharpTools
open Option
open ProgressStream

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


let getStream<'a> requestClient url data (processStream: Stream -> int64 -> Option<DateTime> -> Unit) = 
    use requestMessage = new HttpRequestMessage(HttpMethod.Post, requestClient.GetUri(url))
    requestMessage.Content <- JsonContent.Create(data, data.GetType (), null, getJsonOptions ()) 
    use responseMessage = requestClient.Client.Send (requestMessage, HttpCompletionOption.ResponseHeadersRead) 
    use stream = responseMessage.Content.ReadAsStream()
    let length = responseMessage.Content.Headers.ContentLength.GetValueOrDefault()
    let lastWriteTime = getLastWriteTime responseMessage
    processStream stream length lastWriteTime
      
let postFile requestClient url localFile remotePath filetime progress = 
    use requestMessage = new HttpRequestMessage(HttpMethod.Post, requestClient.GetUri(url + "?path=" + remotePath))

    let fromUnixTime (dt: DateTime) = (DateTimeOffset dt).ToUnixTimeMilliseconds ()
    let toUtcTime (dt: DateTimeOffset) = dt.UtcDateTime
    let unixTime = toUtcTime >> fromUnixTime

    requestMessage.Headers.Add("x-file-date", (unixTime filetime) |> sprintf "%d")
    requestMessage.Content <- new StreamContent(new ProgressStream(File.OpenRead localFile, progress), 8100)
    use responseMessage = requestClient.Client.Send (requestMessage, HttpCompletionOption.ResponseHeadersRead) 
    ()
        