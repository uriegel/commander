#if Linux
using System.Diagnostics;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;

using static CsTools.Core;

static partial class Directory
{
    public static string GetIconPath(FileInfo info)
        => info.Extension?.Length > 0 ? info.Extension : ".noextension";

    public static AsyncResult<DirectoryInfo, RequestError> Validate(this DirectoryInfo info)
        => Ok<DirectoryInfo, RequestError>(info).ToAsyncResult();

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
}

#endif