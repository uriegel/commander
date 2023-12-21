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
    public static Result<DirectoryInfo, IOResult> Validate(this DirectoryInfo info) 
        => info.Exists || !info.FullName.StartsWith(@"\\")
            ? info
            : Error<DirectoryInfo, IOResult>(new(IOErrorType.AccessDenied));

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

    public static Task<GetExtendedItemsResult> GetExtendedItems(GetExtendedItems getExtendedItems)
    {
        Version? GetVersion(string file)
            => FileVersionInfo
                .GetVersionInfo(getExtendedItems
                                    .Path
                                    .AppendPath(file))
                .MapVersion();

        Version? CheckGetVersion(string item)
            => item.EndsWith(".exe", StringComparison.InvariantCultureIgnoreCase) || item.EndsWith(".dll", StringComparison.InvariantCultureIgnoreCase)
                ? GetVersion(item)
                : null;

        return (GetExtendedItems(getExtendedItems.Id, getExtendedItems.Path, getExtendedItems.Items) with 
        {
            Versions = getExtendedItems
                        .Items
                        .Select(CheckGetVersion)
                        .ToArray()
        })
            .ToAsync();
    }

    public static AsyncResult<Nothing, RequestError> RenameItem(RenameItemParam input)            
        => InternalRenameItem(input);

    public static Task<IOResult> DeleteItems(DeleteItemsParam input)
        => new IOResult(SHFileOperation(new ShFileOPStruct
        {
            Func = FileFuncFlags.DELETE,
            From = string.Join( "\U00000000", input.Names.Select(n => input.Path.AppendPath(n))) 
                        +  "\U00000000\U00000000",
            Flags = FileOpFlags.NOCONFIRMATION
                | FileOpFlags.NOERRORUI
                | FileOpFlags.NOCONFIRMMKDIR
                | FileOpFlags.SILENT
                | FileOpFlags.ALLOWUNDO
        }) switch
        {
            0    => IOErrorType.NoError,
            2    => IOErrorType.FileNotFound,
            0x78 => IOErrorType.AccessDenied,
            _    => IOErrorType.Exn
        })
            .ToAsync();

    public static Task<IOResult> ElevateDrive(ElevatedDriveParam param)
    {
        var netResource = new NetResource()
        {
            Scope = ResourceScope.GlobalNetwork,
            ResourceType = ResourceType.Disk,
            DisplayType = ResourceDisplaytype.Share,
            RemoteName = param.Path
        };

        var result = WNetAddConnection2(netResource, param.Password, param.Name, 0);
        return Task.FromResult(new IOResult(
            result == 0
            ? IOErrorType.NoError
            : result == 5
            ? IOErrorType.AccessDenied
            : result == 67
            ? IOErrorType.NetNameNotFound
            : IOErrorType.Exn));
    }

    public static Result<Nothing, IOResult> Copy(string name, string path, string targetPath, Action<long, long> cb, bool move, CancellationToken cancellationToken)
    {
        Copy(path.AppendPath(name), targetPath.AppendPath(name), cb, move, cancellationToken);
        return nothing;
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

    static IOResult MapExceptionToIOError(Exception e)
        => e switch
        {
            IOException ioe when ioe.HResult == -2147024891 => new(IOErrorType.AccessDenied),
            UnauthorizedAccessException ue                  => new(IOErrorType.AccessDenied),
            _                                               => new(IOErrorType.Exn)
        };

    static readonly DateTime startTime = DateTime.Now;
    static string Mount(string path) => "";
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

#endif