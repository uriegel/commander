using System.Net;
using System.Net.Sockets;
using LinqTools;

using static LinqTools.Core;
using static CsTools.HttpRequest.Core;

namespace CsTools.HttpRequest;

public static class Request
{
    static HttpRequestMessage CreateRequest(Settings settings)
        => new HttpRequestMessage(
            settings.Method,
            settings.BaseUrl.GetOrDefault("") + settings.Url)
        {
            Version = new(settings.Version.Major, settings.Version.Minor)
        };

    static void AddHeaders(this HttpRequestMessage msg, Settings settings)
    {
        void AddHeader(Header header)
        {
            if (!msg.Headers.TryAddWithoutValidation(header.Key, header.Value) && msg.Content != null)
                msg.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        settings.Headers.ForEach(n => n.ForEach(AddHeader));
    }

    public static Task<Result<HttpResponseMessage, Error>> RunAsync(Settings settings)
        => RunUnsafeAsync(settings)
            .TryRunAsync();

    public static Task<Result<string, Error>> GetStringAsync(Settings settings)            
        => GetUnsafeStringAsync(settings)
            .TryRunAsync();

    public static Func<Task<Result<HttpResponseMessage, Error>>> RunAsyncApply(Settings settings)
        => () => RunAsync(settings);

    public static Func<Task<Result<string, Error>>> GetStringAsyncApply(Settings settings)
        => () => GetStringAsync(settings);
    
    static async Task<Result<HttpResponseMessage, Error>> RunUnsafeAsync(Settings settings)
    {
        var request = CreateRequest(settings);
        settings.AddContent.ForEach(n => request.Content = n());
        request.AddHeaders(settings);
        var response = await Client.Get().SendAsync(request);
        return response.StatusCode == HttpStatusCode.OK
        ? Ok<HttpResponseMessage, Error>(response)
        : Error<HttpResponseMessage, Error>(NullError with { Status = new(response.StatusCode, response.ReasonPhrase, response) });
    }

    static Task<Result<string, Error>> GetUnsafeStringAsync(Settings settings)
        => from n in RunAsync(settings)
            select n.Content.ReadAsStringAsync();
            
    static Task<Result<T, Error>> TryRunAsync<T>(this Task<Result<T, Error>> t)
            where T : notnull
        => t.Catch(ex => ex switch
            {
                InvalidOperationException ioe 
                    => Error<T, Error>(NullError with { InvalidOperation = ioe.Message }),
                TaskCanceledException 
                    => Error<T, Error>(NullError with { Timeout = true }),
                HttpRequestException hre when hre.InnerException is SocketException se && se.SocketErrorCode == SocketError.HostNotFound 
                    => Error<T, Error>(NullError with { HostNotFound = hre.Message }),
                HttpRequestException hre when hre.InnerException is SocketException se
                    => Error<T, Error>(NullError with { SocketError = se.Message }),
                Exception e                
                    => Error<T, Error>(NullError with { Exception = e })
            });
}