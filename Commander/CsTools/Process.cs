using LinqTools;
using static Core;

namespace CsTools;

public static class Process
{
    public record Result(
        string? Output,
        string? Error,
        int? ExitCode,
        Exception? Exception
    );

    public static Task<Result> RunAsync(string fileName, string args)
        => Try(async () =>
            {
                var proc = await new System.Diagnostics.Process
                {
                    StartInfo = new System.Diagnostics.ProcessStartInfo
                    {
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        FileName = fileName,
                        Arguments = args,
                        CreateNoWindow = true
                    }
                }
                    .SideEffect(p => p.Start())
                    .SideEffect(p => p.WaitForExitAsync());
                var responseString = await proc.StandardOutput.ReadToEndAsync();
                var errorString = await proc.StandardError.ReadToEndAsync();
                return new Result(
                    responseString.WhiteSpaceToNull(),
                    errorString.WhiteSpaceToNull(),
                    proc.ExitCode,
                    null);
            }
        , e => new Result(null, null, null, e));
}