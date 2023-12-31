#if Windows

using Microsoft.AspNetCore.Http;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Diagnostics;

using AspNetExtensions;
using ClrWinApi;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.Async;

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

    public static async Task ProcessIcon(HttpContext context, string iconHint)
    {
        var stream = await GetIconStream(iconHint);
        await context.SendStream(stream!, startTime, "icon.png");
    }

    public static AsyncResult<GetExtendedItemsResult, GetFilesError> GetExtendedItems(GetExtendedItems param)
        => GetExtendedItems(param.Id, param.Path, param.Items)
            .Select(items => items with {
                Versions = param
                            .Items
                            .Select(n => CheckGetVersion(param.Path, n))
                            .ToArray()
            });

    public static AsyncResult<Nothing, RequestError> RenameItem(RenameItemParam input)
        => RenameItemRaw(input)
            .BindErrorAwait(e =>
                (IOErrorType)e.Status == IOErrorType.AccessDenied
                    ? UacServer
                        .StartElevated()
                        .SelectError(_ => new CsTools.HttpRequest.RequestError(1099, "UAC not started"))
                        .ToAsyncResult()
                        .BindAwait(_ => Requests.JsonRequest.Post<RenameItemParam, Nothing>(new("commander/renameitem", input)))
                        .SelectError(e => new RequestError(e.Status, e.StatusText))
                    : Error<Nothing, RequestError>(e).ToAsyncResult());
    public static AsyncResult<Nothing, RequestError> RenameItemUac(RenameItemParam input)
        => RenameItemRaw(input);
    
    public static AsyncResult<Nothing, RequestError> CreateFolder(CreateFolderParam input)
        => CreateFolderRaw(input)
            .BindErrorAwait(e =>
                (IOErrorType)e.Status == IOErrorType.AccessDenied
                    ? UacServer
                        .StartElevated()
                        .SelectError(_ => new CsTools.HttpRequest.RequestError(1099, "UAC not started"))
                        .ToAsyncResult()
                        .BindAwait(_ => Requests.JsonRequest.Post<CreateFolderParam, Nothing>(new("commander/createfolder", input)))
                        .SelectError(e => new RequestError(e.Status, e.StatusText))
                    : Error<Nothing, RequestError>(e).ToAsyncResult());
    public static AsyncResult<Nothing, RequestError> CreateFolderUac(CreateFolderParam input)
        => CreateFolderRaw(input);

    public static AsyncResult<Nothing, RequestError> DeleteItems(DeleteItemsParam input)
        => DeleteItemsRaw(input)
            .BindErrorAwait(e =>
                (IOErrorType)e.Status == IOErrorType.AccessDenied
                    ? UacServer
                        .StartElevated()
                        .SelectError(_ => new CsTools.HttpRequest.RequestError(1099, "UAC not started"))
                        .ToAsyncResult()
                        .BindAwait(_ => Requests.JsonRequest.Post<DeleteItemsParam, Nothing>(new("commander/deleteitems", input)))
                        .SelectError(e => new RequestError(e.Status, e.StatusText))
                    : Error<Nothing, RequestError>(e).ToAsyncResult());
    public static AsyncResult<Nothing, RequestError> DeleteItemsUac(DeleteItemsParam input)
        => DeleteItemsRaw(input);

    public static Result<Nothing, RequestError> ElevateDrive(Credentials credentials)
        => WNetAddConnection2(new()
            {
                Scope = ResourceScope.GlobalNetwork,
                ResourceType = ResourceType.Disk,
                DisplayType = ResourceDisplaytype.Share,
                RemoteName = credentials.Path
            }, credentials.Password, credentials.Name, 0) switch
        {
            0  => Ok<Nothing, RequestError>(nothing),
            67 => Error<Nothing, RequestError>(IOErrorType.NetNameNotFound.ToError()),
            5 or 86  => Error<Nothing, RequestError>(IOErrorType.WrongCredentials.ToError())
                            .SideEffect(_ => Events.Credentials(credentials.Path)),
            _  => Error<Nothing, RequestError>(IOErrorType.Exn.ToError())
        };

    public static Result<Nothing, IOResult> Copy(string name, string path, string targetPath, Action<long, long> cb, bool move, CancellationToken cancellationToken)
    {
        Copy(path.AppendPath(name), targetPath.AppendPath(name), cb, move, cancellationToken);
        return nothing;
    }

    public static AsyncResult<Nothing, RequestError> CredentialsReceived(Result<Credentials, RequestError> credentials)
        => Ok<Nothing, RequestError>(nothing)
            .SideEffect(_ =>
                credentials
                    .Match(
                        ElevateDrive,
                        e => Error<Nothing, RequestError>(e))
                    .SideEffectIf(
                        res => res.Select(_ => true).Get(err => err.Status != (int)IOErrorType.WrongCredentials), 
                        res => credentialsTaskSource?.TrySetResult(res)))
            .ToAsyncResult();

    public static Version? CheckGetVersion(string path, string item)
        => item.EndsWith(".exe", StringComparison.InvariantCultureIgnoreCase) || item.EndsWith(".dll", StringComparison.InvariantCultureIgnoreCase)
            ? FileVersionInfo
                .GetVersionInfo(path.AppendPath(item))
                .MapVersion()
            : null;

    static AsyncResult<Nothing, RequestError> GetCredentials(string path)
    {
        credentialsTaskSource?.TrySetCanceled();
        credentialsTaskSource = new();
        Events.Credentials(path);
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

    static AsyncResult<Nothing, RequestError> DeleteItemsRaw(DeleteItemsParam input)
        => (SHFileOperation(new ShFileOPStruct
            {
                Func = FileFuncFlags.DELETE,
                From = string.Join( "\U00000000", input.Names.Select(input.Path.AppendPath)) 
                            +  "\U00000000\U00000000",
                Flags = FileOpFlags.NOCONFIRMATION
                    | FileOpFlags.NOERRORUI
                    | FileOpFlags.NOCONFIRMMKDIR
                    | FileOpFlags.SILENT
                    | FileOpFlags.ALLOWUNDO
            }) switch
            {
                0    => Ok<Nothing, RequestError>(nothing),
                2    => Error<Nothing, RequestError>(IOErrorType.FileNotFound.ToError()),
                0x78 => Error<Nothing, RequestError>(IOErrorType.AccessDenied.ToError()),
                _    => Error<Nothing, RequestError>(IOErrorType.Exn.ToError())
            })
            .ToAsyncResult();

    static void Copy(string source, string target, Action<long, long> progress, bool move, CancellationToken cancellationToken)
    {
        var cancel = 0;
        cancellationToken.Register(() => cancel = -1);
        if (move) {
            if (!MoveFileWithProgress(source, target.RemoveWriteProtection(), (total, current, c, d, e, f, g, h, i) => {
                progress(current, total);
                return CopyProgressResult.Continue;
            }, IntPtr.Zero, MoveFileFlags.CopyAllowed| MoveFileFlags.ReplaceExisting)) {
                var error = Marshal.GetLastWin32Error();
                if (error == 5)
                    throw new UnauthorizedAccessException();
            }
        }
        else {
            if (!CopyFileEx(source, target.RemoveWriteProtection(), (total, current, c, d, e, f, g, h, i) => {
                progress(current, total);
                return CopyProgressResult.Continue;
            }, IntPtr.Zero, ref cancel, (CopyFileFlags)0)) {
                var error = Marshal.GetLastWin32Error();
                if (error == 5)
                    throw new UnauthorizedAccessException();
            }
        }
    }
  
    static void OnEnter(string path, SpecialKeys? keys) 
    {
        if (keys?.Alt == true || keys?.Ctrl == true) 
        {
            var info = new ShellExecuteInfo();
            info.Size = Marshal.SizeOf(info);
            info.Verb = keys?.Alt == true ? "properties" : "openas";
            info.File = path;
            info.Show = ShowWindowFlag.Show;
            info.Mask = ShellExecuteFlag.InvokeIDList;
            ShellExecuteEx(ref info);     
        }
        else 
        {
            using var proc = new Process()
            {
                StartInfo = new ProcessStartInfo(path)
                {
                    UseShellExecute = true,
                },
            };
                
            proc.Start();        
        }
    }

    static readonly DateTime startTime = DateTime.Now;
    static string Mount(string path) => "";

    static TaskCompletionSource<Result<Nothing, RequestError>>? credentialsTaskSource;
}

record Version(
    int Major,
    int Minor,
    int Patch,
    int Build
);

record GetExtendedItemsResult(
    DateTime?[] ExifTimes,
    Version?[]? Versions,
    string Path
) {
    public GetExtendedItemsResult(DateTime?[] exifTimes, string path)
        : this(exifTimes, null, path) {}
};

static class VersionExtensions
{
    public static Version? MapVersion(this FileVersionInfo? info)
        => info != null
            ? new(info.FileMajorPart, info.FileMinorPart, info.FilePrivatePart, info.FileBuildPart)
            : null;
}    

record Credentials(string Name, string Password, string Path);

#endif