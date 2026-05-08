using System.Net.Http.Json;
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
                            IconPath: n.Name.GetFileExtension(),
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

    public static async Task DeleteItems(DeleteInput input)
    {
        var remoteItem = input.Path.GetRemoteItem();
        await Request.RunAsync(DeleteItems(remoteItem, input));

        static Settings DeleteItems(RemoteItem remoteItem, DeleteInput input)
            => DefaultSettings with
            {
                Method = HttpMethod.Delete,
                BaseUrl = remoteItem.BaseUrl,
                Url = $"/deletefiles",
                AddContent = () => JsonContent.Create(input with { Path = remoteItem.Url })
            };
    }

    public static async Task CopyFromAsync(CopyFromRemoteJob input, Action<long, long> onProgress, CancellationToken? cancellation = null)
    {
        var targetFileName = input.TargetPath.AppendPath(input.Item.Name);
        try
        {
            var remoteItem = input.SourcePath.GetRemoteItem();
            using var msg = await Request.RunAsync(DownloadItem(remoteItem, input.Item.Name), true);
            var len = msg.Content.Headers.ContentLength ?? 0;
            var xDate = msg.GetHeaderLongValue("x-file-date") ?? 0;
            using var targetFile = File
                                        .Create(targetFileName)
                                        .WithProgress((t, c) => onProgress(c, len));
            await msg.Content.ReadAsStream().CopyToAsync(targetFile, cancellation ?? CancellationToken.None);
            targetFile.Dispose();
            File.SetLastWriteTime(targetFileName, xDate.FromUnixTime());

            static Settings DownloadItem(RemoteItem remoteItem, string name)
                => DefaultSettings with
                {
                    Method = HttpMethod.Get,
                    BaseUrl = remoteItem.BaseUrl,
                    Url = $"/downloadfile{remoteItem.Url.AppendPath(name)}"

                };
        }
        catch
        {
            try 
            {
                File.Delete(targetFileName);
            }
            catch {}
        }
    }
    public static async Task CopyToAsync(CopyToRemoteJob input, Action<long, long> onProgress, CancellationToken? cancellation = null)
    {
        string fileName = input.SourcePath.AppendPath(input.Item.Name);
        using var file = File
                            .OpenRead(fileName)
                            .WithProgress((t, c) => onProgress(c, t));
        var remoteItem = input.TargetPath.GetRemoteItem();
        await Request.RunAsync(UploadItem(file, remoteItem, input.Item.Name, new FileInfo(fileName).LastWriteTime));

        static Settings UploadItem(Stream streamToPost, RemoteItem remoteItem, string name, DateTime lastWriteTime)
            => DefaultSettings with
            {
                Method = HttpMethod.Put,
                BaseUrl = remoteItem.BaseUrl,
                Url = $"/putfile{remoteItem.Url.AppendPath(name)}",
                Timeout = 100_000_000,
                AddContent = () => new StreamContent(streamToPost, 8100)
                                    .SideEffect(n => n  
                                                        .Headers
                                                        .TryAddWithoutValidation(
                                                            "x-file-date", 
                                                            new DateTimeOffset(lastWriteTime).ToUnixTimeMilliseconds().ToString()))
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