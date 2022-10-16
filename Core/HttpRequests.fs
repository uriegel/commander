module HttpRequests

open System
open System.Net.Http
open System.Net.Http.Json
open Configuration
open System.Threading
open FSharpTools.Functional
open System.IO

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

let saveFile<'a> requestClient url data = 
    use requestMessage = new HttpRequestMessage(HttpMethod.Post, requestClient.GetUri(url))
    requestMessage.Content <- JsonContent.Create(data, data.GetType (), null, getJsonOptions ()) 
    use responseMessage = requestClient.Client.Send requestMessage 
    let stream = responseMessage.Content.ReadAsStream() 
    File.Delete "/home/uwe/test/test.jpg"
    use target = File.Create "/home/uwe/test/test.jpg"
    stream.CopyTo target
 
