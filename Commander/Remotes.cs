using CsTools.Async;
using CsTools.Extensions;
using CsTools.HttpRequest;

using static CsTools.HttpRequest.Core;

static class Remotes
{
    public static async Task<GetDirectoryItemsOutput> GetFiles(GetFilesInput input)
    {
        var remoteItem = input.Path.GetRemoteItem();
        var jsonGetRequest = new JsonRequest(remoteItem.BaseUrl);
        var items = (await jsonGetRequest
                        .GetAsync<FileType[]>("/getfiles" + remoteItem.Url))
                        .Select(n => new DirectoryItem(
                            n.Name,
                            Size: n.IsDirectory ? null : n.Size,
                            IsDirectory: n.IsDirectory,
                            IsHidden: n.IsHidden,
                            Time: n.Time != 0 ? n.Time.FromUnixTime() : null))
                        .Where(n => input.ShowHidden || n.IsHidden != true)
                        .ToArray();
        var dirCount = items.Count(n => n.IsDirectory == true);
        return new(items, $"remote/{remoteItem.Host}{remoteItem.Url}", dirCount, items.Length - dirCount);
    }

    public static async Task CreateFolder(CreateRemoteFolderInput input)
    {
        var remoteItem = input.Path.AppendPath(input.Item).GetRemoteItem();
        await Request.RunAsync(PostCreateDirectory(remoteItem), true);

        static Settings PostCreateDirectory(RemoteItem remoteItem)
            => DefaultSettings with
            {
                Method = HttpMethod.Post,
                BaseUrl = remoteItem.BaseUrl,
                Url = $"/createdirectory{remoteItem.Url}"
            };
    }

    static RemoteItem GetRemoteItem(this string path)
    {
        var urlPath = path[7..];
        var host = urlPath.SubstringUntil('/');
        var url = Path.GetFullPath("/" + path[7..].SubstringAfter('/'));
        return new("http://" + host, host, url);
    }
}

record RemoteItem(string BaseUrl, string Host, string Url);
record FileType(string Name, bool IsDirectory, long Size, bool IsHidden, long Time);