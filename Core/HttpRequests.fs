module HttpRequests

open System
open System.Net.Http
open System.Net.Http.Json
open Configuration
open System.Threading

let post<'a> url data = task {
    let httpClient = new HttpClient()
    use requestMessage = new HttpRequestMessage(HttpMethod.Post, Uri(url))
    requestMessage.Content <- JsonContent.Create(data, data.GetType (), null, getJsonOptions ()) 
    use! responseMessage = httpClient.SendAsync(requestMessage) 
    return! responseMessage.Content.ReadFromJsonAsync<'a>(getJsonOptions (), CancellationToken.None) 
} 