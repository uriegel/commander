module HttpRequests

open System
open System.Net.Http
open System.Net.Http.Json
open Configuration
open System.Threading
open FSharpTools.Functional

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
