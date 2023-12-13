#if Linux

using Microsoft.AspNetCore.Http;

using AspNetExtensions;
using CsTools.Extensions;
using GtkDotNet;
using LinqTools;
using CsTools;
using System.Diagnostics;

using static LinqTools.Core;
using static CsTools.Core;

static partial class Directory
{
    public static Result<DirectoryInfo, IOError> Validate(this DirectoryInfo info) => info;

    public static string GetIconPath(FileInfo info)
        => info.Extension?.Length > 0 ? info.Extension : ".noextension";

    public static Task ProcessIcon(HttpContext context, string iconHint)
        => RepeatOnException(async () =>
            {
                var directory = $"/usr/share/icons/{Theme.BaseTheme}/16x16/mimetypes";
                var iconFile = (Gtk.GuessContentType(iconHint)?.Replace('/', '-') ?? "") + ".png";
                var path = directory.AppendPath(iconFile);
                if (System.IO.File.Exists(path))
                {
                    using var stream = path.OpenFile();
                    await context.SendStream(stream!, startTime, iconFile);
                } 
                else if (iconFile == "image-jpeg.png" || iconFile == "image-png.png")
                {
                    iconFile = "image-x-generic.png";
                    path = directory.AppendPath(iconFile);
                    if (System.IO.File.Exists(path))
                    {
                        using var stream = path.OpenFile();
                        await context.SendStream(stream!, startTime, iconFile);
                    }
                }
                else if (iconFile == "video-mp4.png" || iconFile == "video-x-matroska.png")
                {
                    iconFile = "video-x-generic.png";
                    path = directory.AppendPath(iconFile);
                    if (System.IO.File.Exists(path))
                    {
                        using var stream = path.OpenFile();
                        await context.SendStream(stream!, startTime, iconFile);
                    }
                }
                else
                {
                    iconFile = "unknown.png";
                    path = directory.AppendPath(iconFile);
                    if (System.IO.File.Exists(path))
                    {
                        using var stream = path.OpenFile();
                        await context.SendStream(stream!, startTime, iconFile);
                    }
                }
            }, 3);

    public static Task<GetExtendedItemsResult> GetExtendedItems(GetExtendedItems getExtendedItems)
        => GetExtendedItems(getExtendedItems.Id, getExtendedItems.Path, getExtendedItems.Items)
            .ToAsync();

    public static Task<Result<Nothing, IOResult>> DeleteItems(DeleteItemsParam input)
        => Gtk.Dispatch(() =>
            input.Names
                .Select(n =>
                    GFile
                    .New(input.Path.AppendPath(n))
                    .Use(f => f.Trash()))
                .FirstOrDefault(n => !n.IsOK)
                .Match(
                    s => s,
                    e => e != null 
                    // TODO GError to IOResult
                        ? Error<Nothing, IOResult>(IOResult.NoError()) 
                        : nothing));

    public static Result<Nothing, GError> Copy(string name, string path, string targetPath, FileCopyFlags flags, ProgressCallback cb, bool move, CancellationToken cancellationToken)
        => GFile
            .New(path.AppendPath(name))
            .Use(f => f.If(move,
                f => f.Move(targetPath.AppendPath(name), flags, true, cb, cancellationToken),
                f => f.Copy(targetPath.AppendPath(name), flags, true, cb, cancellationToken)));

    public static IOError ErrorToIOError(DirectoryError de)
        => de switch
        {
            DirectoryError.AccessDenied => IOError.AccessDenied,
            DirectoryError.DirectoryNotFound => IOError.PathNotFound,
            DirectoryError.NotSupported => IOError.NotSupported,
            DirectoryError.PathTooLong => IOError.PathTooLong,
            _ => IOError.Exn
        };

    static string Mount(string path) 
    {
        var output = "";
        using var proc = new Process()
        {
            StartInfo = new ProcessStartInfo()
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                FileName = "udisksctl",
                CreateNoWindow = true,
                Arguments = $"mount -b /dev/{path}",
            },
            EnableRaisingEvents = true
        };
        proc.OutputDataReceived += (s, e) =>
        {
            if (e.Data != null)
                output = e.Data;
        };
        proc.ErrorDataReceived += (s, e) => Console.Error.WriteLine(e.Data);
        proc.Start();
        proc.BeginOutputReadLine();
        proc.BeginErrorReadLine();
        proc.EnableRaisingEvents = true;
        proc.WaitForExit();
        return output.SubstringAfter(" at ");
    }
    
    static void OnEnter(string path, SpecialKeys? keys) 
    {
        var output = "";
        using var proc = new Process()
        {
            StartInfo = new ProcessStartInfo()
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                FileName = "xdg-open",
                Arguments = $"\"{path}\"",
            },
            EnableRaisingEvents = true
        };
        proc.OutputDataReceived += (s, e) =>
        {
            if (e.Data != null)
                output = e.Data;
        };
        proc.ErrorDataReceived += (s, e) => Console.Error.WriteLine(e.Data);
        proc.Start();
        proc.BeginOutputReadLine();
        proc.BeginErrorReadLine();
        proc.EnableRaisingEvents = true;
        proc.WaitForExit();
    }

    static IOError MapExceptionToIOError(Exception e)
        => e switch
        {
            IOException ioe when ioe.HResult == 13 => IOError.AccessDenied,
            UnauthorizedAccessException ue         => IOError.AccessDenied,
            _                                      => IOError.Exn
        };

    static readonly DateTime startTime = DateTime.Now;
}

record GetExtendedItemsResult(
    DateTime?[] ExifTimes,
    string Path
);

#endif
    // TODO KDE
    // let getKdeIcon ext = async {
    //     let extractMime str = 
    //         let pos1 = str |> String.indexOf "('" 
    //         let pos2 = str |> String.indexOf "',"
    //         match pos1, pos2 with
    //         | Some pos1, Some pos2 
    //             -> Some (str |> String.substring2 (pos1+2) (pos2-pos1-2))
    //         | _ -> None

    //     let replaceSlash str = Some (str |> String.replaceChar  '/' '-')
    //     let getMime = extractMime >=> replaceSlash

    //     let mapVarious mime =
    //         match mime with
    //         | "/usr/share/icons/breeze/mimetypes/16/application-x-msdos-program.svg" 
    //                         -> "/usr/share/icons/breeze/mimetypes/16/application-x-ms-dos-executable.svg"
    //         | "/usr/share/icons/breeze/mimetypes/16/application-java-archive.svg"    
    //                         -> "/usr/share/icons/breeze/mimetypes/16/application-x-jar.svg"
    //         | s     -> s

    //     let! mimeType = asyncRunCmd "python3" (sprintf "%s *%s" (getIconScript ()) ext)

    //     let icon = 
    //         sprintf "/usr/share/icons/breeze/mimetypes/16/%s.svg" (mimeType |> getMime |> defaultValue "application-x-zerosize")
    //         |> mapVarious
    //         |> getExistingFile
    //         |> Option.defaultValue "/usr/share/icons/breeze/mimetypes/16/application-x-zerosize.svg"
    //     return icon, "image/svg+xml"
    // }

//     return! 
//         match getPlatform () with
// //        | Platform.Kde -> getKdeIcon ext
//         | _            -> async { return getIcon ext, "image/png" }
