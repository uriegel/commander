using System.Net.Http.Json;

using CsTools.Extensions;
using CsTools.HttpRequest;
using LinqTools;

using static CsTools.HttpRequest.Core;
using static AspNetExtensions.Core;
using System.Text.Json;

static partial class Remote
{
    static Settings GetFiles(string ip, Func<HttpContent> getContent)
    => DefaultSettings with
        {
            Method = HttpMethod.Post,
            BaseUrl = $"http://{ip}:8080",
            Url = "/getfiles",
            AddContent = getContent
        };

    public static Task<GetFilesResult> GetFiles(GetFiles getFiles)
        => (from n in Request.GetStringAsync(GetFiles(getFiles.Path.StringBetween('/', '/'),
                () => JsonContent.Create(new
                {
                    Path = "/" + getFiles.Path.SubstringAfter('/').SubstringAfter('/')
                })))
            select JsonSerializer
                    .Deserialize<RemoteItem[]>(n, JsonWebDefaults)
                    .GetOrDefault(Array.Empty<RemoteItem>())
                    .Select(ToDirectoryItem)).Select(n => n.ToArray().ToFilesResult(getFiles.Path))
                    .GetOrDefaultAsync(new GetFilesResult(Array.Empty<DirectoryItem>(), getFiles.Path, 1, 2));

    // TODO: Sort order directories
    // TODO: Filter hidden
    static DirectoryItem ToDirectoryItem(this RemoteItem item)
        => new(item.Name, item.Size, item.IsDirectory, null, item.IsHidden, 
            DateTimeOffset.FromUnixTimeMilliseconds(item.Time).LocalDateTime);
    static GetFilesResult ToFilesResult(this DirectoryItem[] items, string path)
        => new GetFilesResult(items, path, items.Where(n => n.IsDirectory).Count(), items.Where(n => !n.IsDirectory).Count());
}

record RemoteItem(
    string Name,
    long Size,
    bool IsDirectory,
    bool IsHidden,
    long Time
);
