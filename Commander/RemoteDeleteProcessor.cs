using System.Threading.Channels;
using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;

using static CsTools.Core;

static class RemoteDeleteProcessor
{
    public static AsyncResult<Nothing, RequestError> AddItems(string[] items)
    {
        cancellationTokenSource = new();
        totalCount += items.Length; 
        if (!startTime.HasValue)
            startTime = DateTime.Now;
        Events.RemoteDeleteStarted();
        items.ForEach(InsertDeleteItem);
        return Ok<Nothing, RequestError>(nothing)
            .ToAsyncResult();
    }

    public static bool WantClose()
        => IsProcessing()
            .SideEffectIf(b => b,
                _ => DeleteProgress.Show()) 
                == false;

    public static void Cancel() => PerformCancel();

    public static bool IsProcessing()
        => jobs.Reader.TryPeek(out var _) || totalCount > 0;

    static void InsertDeleteItem(string item)
        => jobs.Writer.TryWrite(new(item, false));  

    static void PerformCancel()
    {
        try 
        {
            cancellationTokenSource.Cancel();
        }
        catch (Exception e)
        {
            Console.WriteLine($"An error has occurred while cancelling copy jobs: {e}");
        }
    }

    async static void Process()
    {
        await foreach (var job in jobs.Reader.ReadAllAsync())
            await (await Process(job)
                            .ToResult())
                            .Match(Bypass,
                                    e => ProcessError(e, job));
    }

    static AsyncResult<Nothing, RequestError> Process(DeleteJob job)
    {
        async Task<Nothing> Delete()
        {
            if (cancellationTokenSource.IsCancellationRequested)
                return nothing;

            Events.RemoteDeleteChanged(new(job.Path.SubstringAfterLast('/'), totalCount, currentCount, 
                                            startTime.HasValue ? (int)(DateTime.Now - startTime.Value).TotalSeconds : 0, false, false, false));
            await Remote.Delete(job.Path).ToAsync();
            // TODO when error send error and cancel
            Interlocked.Increment(ref currentCount);
            Events.RemoteDeleteChanged(new(job.Path.SubstringAfterLast('/'), totalCount, currentCount, 
                                            startTime.HasValue ? (int)(DateTime.Now - startTime.Value).TotalSeconds : 0, false, false, false));
            return nothing;
        }

        try
        {
            var res = Ok<Nothing, RequestError>(nothing);
            var ar = res.ToAsyncResult();
            return ar
                    .SelectAwait(_ => Delete())
                    .SideEffectWhenOk(n => 
                    {
                        if (jobs.Reader.TryPeek(out var _) == false)
                            Clear();
                    });
        }
        catch (Exception e)
        {
            Console.WriteLine($"Exception occurred while deleteing: {e}");
            return Error<Nothing, RequestError>(IOErrorType.Exn.ToError())
                    .ToAsyncResult();
        }
    }

    static void Clear()
    {
        totalCount = 0;
        startTime = null;
        currentCount = 0;
        Events.RemoteDeleteFinished();
    }

    static Task<DeleteJob[]> GetCurrentJobs()
    {
        async IAsyncEnumerable<DeleteJob> GetCurrentJobs()
        {
            while (true)
                if (jobs.Reader.TryPeek(out var _) != false) 
                    yield return await jobs.Reader.ReadAsync();
                else
                    break;
        }
        return GetCurrentJobs()
            .ToArrayAsync()
            .AsTask();
    }

    static async Task ProcessError(RequestError err)
    {
        await GetCurrentJobs();
        Clear();
        Events.SendCopyError(err);
    }

    static Task ProcessError(RequestError err, DeleteJob job)
        => ProcessError(err);

    static Task Bypass(Nothing _)
        => Task.FromResult(0);

    static RemoteDeleteProcessor() => Process();

    static int totalCount;
    static DateTime? startTime;
    static int currentCount;

    static readonly Channel<DeleteJob> jobs = Channel.CreateUnbounded<DeleteJob>();
    static CancellationTokenSource cancellationTokenSource = new();
}

record DeleteJob(
    string Path, 
    bool IsCancelled
);

