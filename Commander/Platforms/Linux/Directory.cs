#if Linux
using System.Diagnostics;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using GtkDotNet;
using static CsTools.Core;

static partial class Directory
{
    public static string GetIconPath(FileInfo info)
        => info.Extension?.Length > 0 ? info.Extension : ".noextension";

    public static AsyncResult<DirectoryInfo, RequestError> Validate(this DirectoryInfo info)
        => Ok<DirectoryInfo, RequestError>(info).ToAsyncResult();

    public static AsyncResult<GetExtendedItemsResult, RequestError> GetExtendedItems(GetExtendedItems param)
        => GetExtendedItems(param.Id, param.Path, param.Items);

    public static Task<Stream?> ProcessIcon(string iconHint) =>
        Platform.Value == PlatformType.Gnome
            ? ProcessGtkIcon(iconHint)
            : ProcessKdeIcon(iconHint);

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

    static Task<Stream?> ProcessGtkIcon(string iconHint)
        => Task.Run(() =>
                RepeatOnException(() =>
                {
                    var directory = $"/usr/share/icons/{Theme.BaseTheme}/16x16/mimetypes";
                    var iconFile = (Gtk.GuessContentType(iconHint)?.Replace('/', '-') ?? "") + ".png";

                    Console.WriteLine($"Eikon: {iconFile}");

                    var path = directory.AppendPath(iconFile);
                    if (File.Exists(path))
                        return path.OpenFile();
                    else if (iconFile == "image-jpeg.png" || iconFile == "image-png.png")
                    {
                        iconFile = "image-x-generic.png";
                        path = directory.AppendPath(iconFile);
                        return File.Exists(path) ? path.OpenFile() : DefaultIcon(directory);
                    }
                    else if (iconFile == "video-mp4.png" || iconFile == "video-x-matroska.png")
                    {
                        iconFile = "video-x-generic.png";
                        path = directory.AppendPath(iconFile);
                        return File.Exists(path) ? path.OpenFile() : DefaultIcon(directory);
                    }
                    else
                        return DefaultIcon(directory);
                }, 3));

    static Stream? DefaultIcon(string directory)
    {
        var path = directory.AppendPath("application-x-generic.png");
        return File.Exists(path) ? path.OpenFile() : null;
    }
    
    static async Task<Stream?> ProcessKdeIcon(string iconHint)
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
        return iconpath.OpenFile();
    }
}

record GetExtendedItemsResult(ExifData?[] ExifDatas, string Path);

#endif