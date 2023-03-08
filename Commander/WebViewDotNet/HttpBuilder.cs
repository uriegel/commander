using LinqExtensions.Extensions;

public class HttpBuilder
{
    public HttpBuilder CorsOrigin(string origin)
        => this.SideEffect(n => CorsOriginString = origin);

    internal HttpBuilder(int port)
        => Port = port;

    internal string? CorsOriginString { get; private set; }
    internal int Port { get; private set; }
}