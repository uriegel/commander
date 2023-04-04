using System.Net;

namespace CsTools.HttpRequest;

public record Status(
    HttpStatusCode Code,
    string? Text,
    HttpResponseMessage Msg
);

public record Error(
    bool? Timeout,
    string? HostNotFound,
    string? InvalidOperation,
    string? SocketError,
    Exception? Exception,
    Status? Status
);

static partial class Core
{
    public static Error NullError { get; } = new(null, null, null, null, null, null);
}