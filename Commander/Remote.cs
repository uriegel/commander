using System.Net.Http.Json;

using CsTools.Extensions;
using CsTools.HttpRequest;

using static CsTools.HttpRequest.Core;
using CsTools.Async;
using CsTools.Functional;
using CsTools;

using static CsTools.Core;

// TODO: TODO in Android Commander Engine: CopyFileToRemote: copy to remote file "copytoremote", then rename it to the correct filename
// TODO: CreateDirectory
// TODO: Rename File
// TODO: Rename Directory
// TODO: Copy Directories from local to remote
static class Remote
{
    public static AsyncResult<GetFilesRequestResult, RequestError> GetFiles(GetFiles getFiles)
        => getFiles
            .Path
            .GetIpAndPath()
            .Pipe(ipPath =>
                ipPath.GetRequest()
                    .Get<RemoteItem[]>($"getfiles{ipPath.Path}")
                    .Select(n => n
                        .Select(ToDirectoryItem)
                        .Where(n => getFiles.ShowHiddenItems || !n.IsHidden)
                        .ToArray()
                        .ToFilesResult(getFiles.Path)));

    public static Result<Nothing, RequestError> CopyFrom(string name, string path, string targetPath, Action<long, long> cb, bool move, CancellationToken cancellationToken)
        => Request
            .Run(path.GetIpAndPath().GetFile(name), true)
            .Pipe(res => targetPath.AppendLinuxPath(name)
                .Pipe(targetName => 
                    res.BindAwait(msg => msg.UseAwait(
                        msg => msg
                            .Pipe(msg => msg.Content.Headers.ContentLength ?? 0)
                            .Pipe(len =>
                                File
                                    .Create(targetName)
                                    .WithProgress((t, c) => cb(c, len))
                                    .UseAwait(target => msg.CopyToStream(target, cancellationToken))
                            )
                            .SideEffectWhenOk(msg => msg
                                .GetHeaderLongValue("x-file-date")
                                ?.SetLastWriteTime(targetName))
                            .SideEffectWhenError(_ => targetName.SaveDelete())
            ))))
            .Select(_ => nothing)
            .ToResult()
            .Result;

    public static Result<Nothing, RequestError> CopyTo(string name, string path, string targetPath, DateTime time, Action<long, long> cb, bool move, CancellationToken cancellationToken)
        => File
            .OpenRead(path.AppendPath(name))
            .WithProgress((t, c) => cb(c, t))
            .UseAwait(source =>
                Request
                    .Run(source.PutFile(targetPath.GetIpAndPath(), name, time), true))
                    .Select(_ => nothing)
            .ToResult()
            .Result;

    public static AsyncResult<Nothing, RequestError> Delete(DeleteItemsParam input)
        => input
            .Names
            .Aggregate(Ok<Nothing, RequestError>(nothing), (acc, n) =>
                acc.SelectMany(_ => 
                    Request
                        .Run(
                            input
                                .Path
                                .GetIpAndPath()
                                .DeleteFile(n))
                        .Select(_ => nothing)
                        .ToResult()
                        .Result
                    ))
                .ToAsyncResult();

    static Settings GetFile(this IpAndPath ipAndPath, string name) 
        => DefaultSettings with
        {
            Method = HttpMethod.Get,
            BaseUrl = $"http://{ipAndPath.Ip}:8080",
            Url = $"/downloadfile/{ipAndPath.Path.AppendLinuxPath(name)}",
        };

    static Settings PutFile(this Stream streamToPost, IpAndPath ipAndPath, string name, DateTime lastWriteTime) 
        => DefaultSettings with
        {
            Method = HttpMethod.Put,
            BaseUrl = $"http://{ipAndPath.Ip}:8080",
            Url = $"/putfile/{ipAndPath.Path.AppendLinuxPath(name)}",
            Timeout = 100_000_000,
            AddContent = () => new StreamContent(streamToPost, 8100)
                                    .SideEffect(n => n  
                                                        .Headers
                                                        .TryAddWithoutValidation(
                                                            "x-file-date", 
                                                            new DateTimeOffset(lastWriteTime).ToUnixTimeMilliseconds().ToString()))
        };

    static Settings DeleteFile(this IpAndPath ipAndPath, string name) 
        => DefaultSettings with
        {
            Method = HttpMethod.Delete,
            BaseUrl = $"http://{ipAndPath.Ip}:8080",
            Url = $"/deletefile/{ipAndPath.Path.AppendLinuxPath(name)}",
            Timeout = 100_000_000,
        };

    static DirectoryItem ToDirectoryItem(this RemoteItem item)
        => new(
                item.Name, 
                item.Size, 
                item.IsDirectory, 
                null, 
                item.IsHidden, 
                item.Time.FromUnixTime()
            );

    static JsonRequest GetRequest(this IpAndPath ipAndPath)
        => new($"http://{ipAndPath.Ip}:8080");

    static GetFilesRequestResult ToFilesResult(this DirectoryItem[] items, string path)
        => new GetFilesRequestResult(items, path, items.Where(n => n.IsDirectory).Count(), items.Where(n => !n.IsDirectory).Count());

    static IpAndPath GetIpAndPath(this string url)
        => new(url.StringBetween('/', '/'), "/" + url.SubstringAfter('/').SubstringAfter('/'));

    static void SetLastWriteTime(this long unixTime, string targetFilename)
        => File.SetLastWriteTime(targetFilename, unixTime.FromUnixTime());

    static string AppendLinuxPath(this string path, string pathToAppend)
        => path.EndsWith('/')
            ? path + pathToAppend
            : path + '/' + pathToAppend;

    static Remote()
        => Client.Init(8, TimeSpan.FromDays(1));
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


