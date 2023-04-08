using System.Net.Http.Json;

using CsTools.Extensions;
using CsTools.HttpRequest;
using LinqTools;
using LinqTools.Async;

using static CsTools.HttpRequest.Core;
using static AspNetExtensions.Core;
using System.Text.Json;
using CsTools;

static class Remote
{
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
                        .ToFilesResult(getFiles.Path));

    public static Task<IOResult> CopyItemsFromRemote(CopyItemsParam input)
        => CopyItemsFromRemote(input.Path.GetIpAndPath(), input.TargetPath, input.Items, input.Move)
                .Catch(MapExceptionToIOResult);

    static Settings GetFiles(this IpAndPath ipAndPath)
    => DefaultSettings with
        {
            Method = HttpMethod.Post,
            BaseUrl = $"http://{ipAndPath.Ip}:8080",
            Url = "/getfiles",
            AddContent = () => JsonContent.Create(new { Path = ipAndPath.Path })
        };

    static Settings GetFile(this IpAndPath ipAndPath, string name) 
        => DefaultSettings with
        {
            Method = HttpMethod.Post,
            BaseUrl = $"http://{ipAndPath.Ip}:8080",
            Url = "/getfile",
            // TODO: appendLinuxPath
            AddContent = () => JsonContent.Create(new { Path = ipAndPath.Path.AppendPath(name) })
        };

    static DirectoryItem ToDirectoryItem(this RemoteItem item)
        => new(item.Name, item.Size, item.IsDirectory, null, item.IsHidden, 
            DateTimeOffset.FromUnixTimeMilliseconds(item.Time).LocalDateTime);
    static GetFilesResult ToFilesResult(this DirectoryItem[] items, string path)
        => new GetFilesResult(items, path, items.Where(n => n.IsDirectory).Count(), items.Where(n => !n.IsDirectory).Count());

    static IpAndPath GetIpAndPath(this string url)
        => new(url.StringBetween('/', '/'), "/" + url.SubstringAfter('/').SubstringAfter('/'));

    static async Task<IOResult> CopyItemsFromRemote(IpAndPath ipAndPath, string targetPath, CopyItem[] items, bool move)
        => await CopyItems(items
                        .Select(n => n.Size)
                        .Aggregate(0L, (a, b) => a + b), 
                    ipAndPath, targetPath, items, move, Cancellation.Create());

    static async Task<IOResult> CopyItems(long totalSize, IpAndPath ipAndPath, string targetPath, CopyItem[] items, bool move, CancellationToken cancellationToken)
        => (await items.ToAsyncEnumerable().AggregateAwaitAsync(0L, async (count, n) =>
        {
            if (cancellationToken.IsCancellationRequested)
                return 0;
            using var file = File.Create(targetPath.AppendPath(n.Name));
            await CopyItemAsync(n.Name, ipAndPath, file,
                (c, t) => Events.CopyProgressChanged(new(n.Name, t, c, totalSize, count + c)),
                move, cancellationToken);
            return count + n.Size;
        }))
            .ToIOResult();

    // TODO Buffered read
    static Task CopyItemAsync(string name, IpAndPath ipAndPath, Stream targetFile, OnCopyProgress progress, bool move, CancellationToken cancellationToken)
        =>  from msg in Request.RunAsync(ipAndPath.GetFile(name))
            select msg
                    .GetResponseStream()
                    .WithProgress(progress)
                    .SideEffect(s => s.CopyTo(targetFile));
    // TODO DateTime
    static IOResult ToIOResult<T>(this T t)
        => (new IOResult(null));

    // TODO Exceptions
    static IOError MapExceptionToIOError(Exception e)
        => e switch
        {
            UnauthorizedAccessException ue                     => IOError.AccessDenied,
            _                                                  => IOError.Exn
        };

    static IOResult MapExceptionToIOResult(Exception e)
        => new(MapExceptionToIOError(e));
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