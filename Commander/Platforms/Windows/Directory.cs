#if Windows

using CsTools.Functional;
using CsTools.HttpRequest;

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