#if Linux
using System.Diagnostics;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using WebServerLight;

using static CsTools.ProcessCmd;
using static CsTools.Core;
using static CsTools.Functional.Memoization;
using CsTools;
using GtkDotNet;

static partial class Directory
{
    public static string GetIconPath(FileInfo info)
        => info.Extension?.Length > 0 ? info.Extension : ".noextension";

    public static AsyncResult<DirectoryInfo, RequestError> Validate(this DirectoryInfo info)
        => Ok<DirectoryInfo, RequestError>(info).ToAsyncResult();

    public static Task<bool> ProcessIcon(string iconHint, IRequest request) =>
        Platform.Value == PlatformType.Gnome
            ? ProcessGtkIcon(iconHint, request)
            : ProcessKdeIcon(iconHint, request);

    public static Task<Result<Nothing, RequestError>> DeleteItems(DeleteItemsParam input)
        => Gtk.Dispatch(() =>
                    input.Names
                        .Select(n =>
                            GFile
                            .New(input.Path.AppendPath(n))
                            .Use(f => f.Trash()))
                        .FirstOrDefault(n => n.IsError)
                        .SelectError(GErrorToRequestError));

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

    static Task<bool> ProcessGtkIcon(string iconHint, IRequest request)
        => Task.Run(() =>
                RepeatOnException(async () =>
                {
                    var iconFile = await GetGtkIcon(iconHint);
                    using var icon = File.OpenRead(iconFile ?? "");
                    await request.SendAsync(icon, (int)icon.Length, MimeType.Get(iconFile?.GetFileExtension()) ?? MimeTypes.ImageJpeg);
                    return true;
                }, 3));

    static async Task<bool> ProcessKdeIcon(string iconHint, IRequest request)
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
        var file = iconpath.OpenFile();
        await request.SendAsync(file, (int)file.Length, "image.svg");
        return true;
    }
    static Func<string> GetGtkIconScript { get; } = Memoize(() =>
        Environment
            .GetFolderPath(Environment.SpecialFolder.ApplicationData)
            .AppendPath(Globals.AppId)
            .SideEffect(d => d.EnsureDirectoryExists())
            .AppendPath("geticon.py")
            .SideEffect(p => p.WriteAllTextToFilePath(new StreamReader(Resources.Get("geticon")!).ReadToEnd())));
    static Func<string, Task<string?>> GetGtkIcon { get; } = MemoizeAsync<string>(InitGtkIcon, true);

    static Task<string?> InitGtkIcon(string iconHint, string? oldValue)
        => RepeatOnException(async ()
            => (await RunAsync("python3", $"\"{GetGtkIconScript()}\" {iconHint}")).TrimEnd(), 3) as Task<string?>;

    static Version? GetVersion(string _) => null;

    static RequestError GErrorToRequestError(GError ge)
        => ge switch
        {
            FileError fe when fe.Error == FileError.ErrorType.AccessDenied => IOErrorType.AccessDenied.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.SourceNotFound => IOErrorType.FileNotFound.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.TargetNotFound => IOErrorType.PathNotFound.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.TargetExisting => IOErrorType.AlreadyExists.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.NoDiskSpace => IOErrorType.NoDiskSpace.ToError(),
            FileError fe when fe.Error == FileError.ErrorType.Canceled => IOErrorType.Canceled.ToError(),
            _ => IOErrorType.Exn.ToError()
        };
}

record Version();

#endif

