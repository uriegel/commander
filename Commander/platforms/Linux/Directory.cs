#if Linux

using Microsoft.AspNetCore.Http;

using AspNetExtensions;
using CsTools.Extensions;
using GtkDotNet;
using System.Diagnostics;
using CsTools.Functional;

using static CsTools.Core;

static partial class Directory
{
    public static AsyncResult<DirectoryInfo, RequestError> Validate(this DirectoryInfo info)
        => Ok<DirectoryInfo, RequestError>(info).ToAsyncResult();

    public static string GetIconPath(FileInfo info)
        => info.Extension?.Length > 0 ? info.Extension : ".noextension";

    public static Task ProcessIcon(HttpContext context, string iconHint)
        => Platform.Value == PlatformType.Gnome
            ? ProcessGtkIcon(context, iconHint)
            : ProcessKdeIcon(context, iconHint);

    public static AsyncResult<Nothing, RequestError> RenameItem(RenameItemParam input)            
        => RenameItemRaw(input);

    public static AsyncResult<Nothing, RequestError> CreateFolder(CreateFolderParam input)            
        => CreateFolderRaw(input);

    public static AsyncResult<Nothing, RequestError> DeleteItems(DeleteItemsParam input)
        => DeleteItemsRaw(input);

    public static AsyncResult<Nothing, RequestError> DeleteItemsRaw(DeleteItemsParam input)
        =>  Gtk.Dispatch(() =>
                input.Names
                    .Select(n =>
                        GFile
                        .New(input.Path.AppendPath(n))
                        .Use(f => f.Trash()))
                    .FirstOrDefault(n => n.IsError)
                    .SelectError(GErrorToRequestError))
            .ToAsyncResult();

    public static Result<Nothing, IOResult> Copy(string name, string path, string targetPath, ProgressCallback cb, bool move, CancellationToken cancellationToken)
        => GFile
            .New(path.AppendPath(name))
            .Use(f => f.If(move,
                f => f.Move(targetPath.AppendPath(name), FileCopyFlags.Overwrite, true, cb, cancellationToken),
                f => f.Copy(targetPath.AppendPath(name), FileCopyFlags.Overwrite, true, cb, cancellationToken)))
            .SelectError(GErrorToIOResult);

    public static IOResult GErrorToIOResult(GError ge)
        => ge switch
        {
            FileError fe when fe.Error == FileError.ErrorType.AccessDenied   => new(IOErrorType.AccessDenied),
            FileError fe when fe.Error == FileError.ErrorType.SourceNotFound => new(IOErrorType.FileNotFound),
            FileError fe when fe.Error == FileError.ErrorType.TargetNotFound => new(IOErrorType.PathNotFound),
            FileError fe when fe.Error == FileError.ErrorType.TargetExisting => new(IOErrorType.AlreadyExists),
            FileError fe when fe.Error == FileError.ErrorType.Canceled       => new(IOErrorType.Canceled),
            _                                                                => new(IOErrorType.Exn),
        };

    public static RequestError GErrorToRequestError(GError ge)
        => ge switch
        {
            FileError fe when fe.Error == FileError.ErrorType.AccessDenied   => IOErrorType.AccessDenied.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.SourceNotFound => IOErrorType.FileNotFound.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.TargetNotFound => IOErrorType.PathNotFound.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.TargetExisting => IOErrorType.AlreadyExists.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.Canceled       => IOErrorType.Canceled.ToError(),
            _                                                                => IOErrorType.Exn.ToError()
        };

    static Task ProcessGtkIcon(HttpContext context, string iconHint)
        => RepeatOnException(async () =>
            {
                var directory = $"/usr/share/icons/{Theme.BaseTheme}/16x16/mimetypes";
                var iconFile = (Gtk.GuessContentType(iconHint)?.Replace('/', '-') ?? "") + ".png";
                var path = directory.AppendPath(iconFile);
                if (File.Exists(path))
                {
                    using var stream = path.OpenFile();
                    await context.SendStream(stream!, startTime, iconFile);
                } 
                else if (iconFile == "image-jpeg.png" || iconFile == "image-png.png")
                {
                    iconFile = "image-x-generic.png";
                    path = directory.AppendPath(iconFile);
                    if (File.Exists(path))
                    {
                        using var stream = path.OpenFile();
                        await context.SendStream(stream!, startTime, iconFile);
                    }
                }
                else if (iconFile == "video-mp4.png" || iconFile == "video-x-matroska.png")
                {
                    iconFile = "video-x-generic.png";
                    path = directory.AppendPath(iconFile);
                    if (File.Exists(path))
                    {
                        using var stream = path.OpenFile();
                        await context.SendStream(stream!, startTime, iconFile);
                    }
                }
                else
                {
                    iconFile = "unknown.png";
                    path = directory.AppendPath(iconFile);
                    if (File.Exists(path))
                    {
                        using var stream = path.OpenFile();
                        await context.SendStream(stream!, startTime, iconFile);
                    }
                }
            }, 3);

    static async Task ProcessKdeIcon(HttpContext context, string iconHint)
    {
        var output = "";
        using var proc = new Process()
        {
            StartInfo = new ProcessStartInfo()
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                FileName = "python3",
                Arguments = $"-c \"import mimetypes; import sys; print(mimetypes.guess_type('test.{iconHint}'))\"",
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
        await proc.WaitForExitAsync();
        var mime = output
                    .StringBetween('(', ',')
                    .Replace("'", "")
                    .Replace("None", "")
                    .Replace("application-x-msdos-program", "application-x-ms-dos-executable")
                    .Replace("application-java-archive", "application-x-jar")
                    .Replace('/', '-')
                    .WhiteSpaceToNull()
                    ?? "application-x-zerosize";
        var iconpath = $"/usr/share/icons/breeze/mimetypes/16/{mime}.svg";
        if (!File.Exists(iconpath))
            iconpath = $"/usr/share/icons/breeze/mimetypes/16/application-x-zerosize.svg";
        using var stream = iconpath.OpenFile();
        await context.SendStream(stream!, startTime, iconpath);
    }

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

    static IOResult MapGErrorToIOError(GError e)
        => e switch
        {
            GError ge when e is FileError fe && fe.Error == FileError.ErrorType.AccessDenied   => new(IOErrorType.AccessDenied),
            GError ge when e is FileError fe && fe.Error == FileError.ErrorType.SourceNotFound => new(IOErrorType.AlreadyExists),
            GError ge when e is FileError fe && fe.Error == FileError.ErrorType.TargetNotFound => new(IOErrorType.AlreadyExists),
            _                                                                                  => new(IOErrorType.Exn)
        };

    static readonly DateTime startTime = DateTime.Now;
}

record GetExtendedItemsResult(
    DateTime?[] ExifTimes,
    string Path
);

#endif

