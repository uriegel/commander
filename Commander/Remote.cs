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
                    Path = getFiles.Path.SubstringAfter('/').SubstringAfter('/') + '/'
                }.SideEffect(n => Console.WriteLine($"Hallo1 {n}")), null, JsonWebDefaults)))
            select JsonSerializer
                    .Deserialize<RemoteItem[]>(n.SideEffect(n => Console.WriteLine($"Hallo {n}")), JsonWebDefaults)
                    .GetOrDefault(Array.Empty<RemoteItem>())
                    .Select(ToDirectoryItem)).Select(n => n.ToFilesResult(getFiles.Path))
                    .GetOrDefaultAsync(new GetFilesResult(Array.Empty<DirectoryItem>(), getFiles.Path, 1, 2));

    // TODO: file time UnixTime
    // TODO: icon ext
    static DirectoryItem ToDirectoryItem(this RemoteItem item)
        => new(item.Name, item.Size, item.IsDirectory, null, item.IsHidden, DateTime.Now);
    // TODO: dir count? file count? 
    // TODO: ..: eliminate
    static GetFilesResult ToFilesResult(this IEnumerable<DirectoryItem> items, string path)
        => new GetFilesResult(items.ToArray(), path, 9, 8);
}
//getFiles.Path, 3, 4);
record RemoteItem(
    string Name,
    long Size,
    bool IsDirectory,
    bool IsHidden,
    long Time
);
