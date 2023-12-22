#if Windows
using CsTools.HttpRequest;

static class Requests
{
    public static JsonRequest JsonRequest { get; } = new("http://localhost:21000");
}



#endif