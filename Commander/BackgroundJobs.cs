using System.Threading.Channels;

static class BackgroundJobs
{
    public static bool IsIdle() => !jobs.Reader.TryPeek(out var _);

    public static void Test()
    {
        jobs.Writer.TryWrite("");
    }

    static BackgroundJobs()
        => jobs = Channel.CreateUnbounded<string>();

    static readonly Channel<string> jobs;
}