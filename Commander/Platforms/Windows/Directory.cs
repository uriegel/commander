#if Windows

using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using ClrWinApi;
using CsTools.Async;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using WebServerLight;

using static ClrWinApi.Api;
using static CsTools.Core;

static partial class Directory
{
    public static AsyncResult<DirectoryInfo, RequestError> Validate(this DirectoryInfo info)
        => (info.Exists || !info.FullName.StartsWith(@"\\")
            ? info
            : Error<DirectoryInfo, RequestError>(IOErrorType.AccessDenied.ToError()))
            .ToAsyncResult()
            .BindErrorAwait(n =>
                n.Status == (int)IOErrorType.AccessDenied
                ? GetCredentials(info.FullName)
                    .Select(_ => info.FullName.CreateDirectoryInfo())
                : Error<DirectoryInfo, RequestError>(n).ToAsyncResult());

    public static string GetIconPath(FileInfo info)
        => string.Compare(info.Extension, ".exe", true) == 0
        ? info.FullName
        : info.Extension?.Length > 0 ? info.Extension
        : ".noextension";

    public async static Task<bool> ProcessIcon(string iconHint, GetRequest request)
    {
        var stream = await GetIconStream(iconHint);
        if (stream != null)
        {
            await request.SendAsync(stream, (int)stream.Length, "image/png");
            return true;
        }
        else
            return false;
    }

    public static AsyncResult<GetExtendedItemsResult, RequestError> GetExtendedItems(GetExtendedItems param)
        => GetExtendedItems(param.Id, param.Path, param.Items)
            .Select(items => items with
            {
                Versions = [.. param
                            .Items
                            .Select(n => CheckGetVersion(param.Path, n))]
            });

    public static Version? CheckGetVersion(string path, string item)
        => item.EndsWith(".exe", StringComparison.InvariantCultureIgnoreCase) || item.EndsWith(".dll", StringComparison.InvariantCultureIgnoreCase)
            ? null // TODO FileVersionInfo
                   //     .GetVersionInfo(path.AppendPath(item))
                   //     .MapVersion()
            : null;

    static string Mount(string path) => "";

    static AsyncResult<Nothing, RequestError> GetCredentials(string path)
    {
        credentialsTaskSource?.TrySetCanceled();
        credentialsTaskSource = new();
        // TODO Events
        // Events.Credentials(path);
        return credentialsTaskSource.Task.ToAsyncResult();
    }

    static Task<Stream> GetIconStream(string iconHint)
        => Try(() => iconHint.Contains('\\')
            ? (Icon.ExtractAssociatedIcon(iconHint)?.Handle ?? 0).ToAsync()
            : RepeatOnException(() =>
                {
                    var shinfo = new ShFileInfo();
                    var handle = SHGetFileInfo(iconHint, ClrWinApi.FileAttributes.Normal, ref shinfo, Marshal.SizeOf(shinfo),
                        SHGetFileInfoConstants.ICON | SHGetFileInfoConstants.SMALLICON | SHGetFileInfoConstants.USEFILEATTRIBUTES | SHGetFileInfoConstants.TYPENAME);
                    return shinfo.IconHandle != IntPtr.Zero
                        ? shinfo.IconHandle.ToAsync()
                        : throw new Exception("Not found");
                }, 3, TimeSpan.FromMilliseconds(40)), _ => Icon.ExtractAssociatedIcon(@"C:\Windows\system32\SHELL32.dll")!.Handle)
            ?.Select(handle =>
                {
                    using var icon = Icon.FromHandle(handle);
                    using var bitmap = icon.ToBitmap();
                    var ms = new MemoryStream();
                    bitmap.Save(ms, ImageFormat.Png);
                    ms.Position = 0;
                    DestroyIcon(handle);
                    return ms as Stream;
                })
            ?? (new MemoryStream() as Stream).ToAsync();

    static TaskCompletionSource<Result<Nothing, RequestError>>? credentialsTaskSource;
}

record Version(
    int Major,
    int Minor,
    int Patch,
    int Build
);

record GetExtendedItemsResult(
    ExifData?[] ExifDatas,
    Version?[]? Versions,
    string Path
)
{
    public GetExtendedItemsResult(ExifData?[] exifTimes, string path)
        : this(exifTimes, null, path) { }
};


#endif