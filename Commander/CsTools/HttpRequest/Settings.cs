namespace CsTools.HttpRequest;

public record Version(
    int Major,
    int Minor
);

public record Header(
    string Key,
    string Value
);

public record Settings(
    HttpMethod Method,
    string? BaseUrl,
    string Url,
    Version Version,
    Header[]? Headers,
    Func<HttpContent>? AddContent
);
