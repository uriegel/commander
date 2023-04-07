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
        => (from n in Request.GetStringAsync(
                getFiles
                    .Path
                    .GetIpAndPath()
                    .GetFiles())
            select JsonSerializer
                    .Deserialize<RemoteItem[]>(n, JsonWebDefaults)
                    .GetOrDefault(Array.Empty<RemoteItem>())
                    .Select(ToDirectoryItem))
                        .Select(n => n.Where(n => getFiles.ShowHiddenItems ? true : !n.IsHidden).ToArray()
                        .ToFilesResult(getFiles.Path))
                    .GetOrDefaultAsync(new GetFilesResult(Array.Empty<DirectoryItem>(), getFiles.Path, 1, 2));

    public static  Task<IOResult> CopyItemsFromRemote(CopyItemsParam input)
        => CopyItemsFromRemote(input.Path.GetIpAndPath(), input.TargetPath, input.Items, input.Move);

    static Settings GetFiles(this IpAndPath ipAndPath) 
        => GetFiles(ipAndPath.Ip, () => JsonContent.Create(new { Path = ipAndPath.Path }));

    static DirectoryItem ToDirectoryItem(this RemoteItem item)
        => new(item.Name, item.Size, item.IsDirectory, null, item.IsHidden, 
            DateTimeOffset.FromUnixTimeMilliseconds(item.Time).LocalDateTime);
    static GetFilesResult ToFilesResult(this DirectoryItem[] items, string path)
        => new GetFilesResult(items, path, items.Where(n => n.IsDirectory).Count(), items.Where(n => !n.IsDirectory).Count());

    static IpAndPath GetIpAndPath(this string url)
        => new(url.StringBetween('/', '/'), "/" + url.SubstringAfter('/').SubstringAfter('/'));

    static  Task<IOResult> CopyItemsFromRemote(IpAndPath ipAndPath, string targetPath, CopyItem[] Items, bool Move)
        => (new IOResult(null)).ToAsync();
}

record RemoteItem(
    string Name,
    long Size,
    bool IsDirectory,
    bool IsHidden,
    long Time
);

record IpAndPath(
    string Ip,
    string Path
);