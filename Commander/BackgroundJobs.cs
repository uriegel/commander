using System.Threading.Channels;

static class BackgroundJobs
{
    public static bool IsActive() => jobs.Reader.TryPeek(out var _);

    static readonly Channel<string> jobs;
}