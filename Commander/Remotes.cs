using CsTools.Async;
using CsTools.Extensions;
using CsTools.HttpRequest;

static class Remotes
{
    public static async Task<GetDirectoryItemsOutput> GetFiles(GetFilesInput input)
    {
        var remoteItem = input.Path.GetRemoteItem();
        var jsonGetRequest = new JsonRequest("http://" + remoteItem.BaseUrl);
        var remotePath = Path.GetFullPath("/" + remoteItem.Url);
        var items = (await jsonGetRequest
                        .GetAsync<FileType[]>("/getfiles" + remotePath))
                        .Select(n => new DirectoryItem(
                            n.Name,
                            Size: n.IsDirectory ? null : n.Size,
                            IsDirectory: n.IsDirectory,
                            IsHidden: n.IsHidden,
                            Time: n.Time != 0 ? n.Time.FromUnixTime() : null))
                        .Where(n => input.ShowHidden || n.IsHidden != true)
                        .ToArray();
        var dirCount = items.Count(n => n.IsDirectory == true);
        return new(items, $"remote/{remoteItem.BaseUrl}{remotePath}", dirCount, items.Length - dirCount);
    }

    static RemoteItem GetRemoteItem(this string path)
        => new(path[7..].SubstringUntil('/'), path[7..].SubstringAfter('/'));
}

record RemoteItem(string BaseUrl, string Url);
record FileType(string Name, bool IsDirectory, long Size, bool IsHidden, long Time);