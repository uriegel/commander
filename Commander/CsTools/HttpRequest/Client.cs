using static CsTools.Functional.Memoization;

namespace CsTools.HttpRequest;

public static class Client
{
    public static void Init(int maxConnections)
        => Client.maxConnections = maxConnections;

    public static Func<HttpClient> Get { get; } = Memoize(Init);

    static HttpClient Init()
        => new HttpClient(new HttpClientHandler()
        {
            MaxConnectionsPerServer = maxConnections
        });

    static int maxConnections = 8;
}

public static partial class Core1
{
    public static Settings DefaultSettings { get; } = new(HttpMethod.Get, null, "", new(2, 0), null, null);
}