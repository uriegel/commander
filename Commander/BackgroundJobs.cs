using System.Threading.Channels;

static class BackgroundJobs
{
    public static bool IsIdle()
    {
        var active = jobs.Reader.TryPeek(out var _) || inProcess.CurrentCount == 0;
        if (active)
            ProgressControl.Instance?.ShowPopover();
        return !active;
    }

    public async static Task AddJobAsync(CopyInput input)
    {
        await foreach (var item in input.Items.ToAsyncEnumerable())
        {
            Interlocked.Add(ref totalMaxBytes, item.Size);
            Interlocked.Increment(ref maxCount);
            await jobs.Writer.WriteAsync(new(input.Move ? "Verschieben" : "Kopieren", input.SourcePath, input.TargetPath, item, input.Move));
        }
    }

    public static void Cancel() => cancellation?.Cancel();

    static BackgroundJobs()
    {
        inProcess = new(1, 1);
        jobs = Channel.CreateUnbounded<JobBase>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
        jobProcessorTask = Task.
        Run(RunProcessing);
    }

    static async Task RunProcessing()
    {
        await foreach (var n in jobs.Reader.ReadAllAsync())
        {
            if (cancellation?.IsCancellationRequested != true)
            {
                await inProcess.WaitAsync();
                try
                {
                    await Process(n);
                }
                catch (Exception e)
                {
                    Console.Error.WriteLine($"Exception in background processing: {e}");
                }
                finally
                {
                    inProcess.Release();
                }
            }
            else
                AfterProcess();
        }
    }

    static async Task Process(JobBase job)
    {
        void OnProgress(long curr, long max)
            => ProgressContext.Instance.CopyProgress = new(job.Title, job.Item.Name, maxCount, currentCount,
                    totalMaxBytes, totalCurrentBytes, job.Item.Size, curr, true, DateTime.UtcNow - start);

        try
        {
            if (ProgressContext.Instance.CopyProgress == null)
            {
                start = DateTime.UtcNow;
                cancellation = new CancellationTokenSource();
                ProgressContext.Instance.CopyProgress = new(job.Title, job.Item.Name, maxCount, Interlocked.Increment(ref currentCount),
                    totalMaxBytes, totalCurrentBytes, job.Item.Size, 0, true, DateTime.UtcNow - start);
            }
            else
                Interlocked.Increment(ref currentCount);
#if Linux                
            await Directory.CopyAsync(job, OnProgress, cancellation?.Token);
            Interlocked.Add(ref totalCurrentBytes, job.Item.Size);
#endif            
        }
        catch (OperationCanceledException) { }
        catch (Exception)
        {
            //            job.Completion.TrySetException(e);
        }
        finally
        {
            AfterProcess();
        }
    }

    static void AfterProcess()
    {
        if (!jobs.Reader.TryPeek(out var _))
        {
            CleanUp();
            if (ProgressContext.Instance.CopyProgress != null)
            {
                ProgressContext.Instance.CopyProgress = ProgressContext.Instance.CopyProgress with { IsRunning = false };
                Requests.SendJson(new(null, "CopyStop", new()));
                DelayedCleanup();
            }
        }
    }

    static void CleanUp()
    {
        cancellation = null;
        totalCurrentBytes = 0;
        totalMaxBytes = 0;
        currentCount = 0;
        maxCount = 0;
    }

    static async void DelayedCleanup()
    {
        await Task.Delay(5000);
        if (ProgressContext.Instance.CopyProgress?.IsRunning != true)
            ProgressContext.Instance.CopyProgress = null;
    }

    static readonly Channel<JobBase> jobs;
    static readonly Task jobProcessorTask;
    static readonly SemaphoreSlim inProcess;
    static long totalCurrentBytes;
    static long totalMaxBytes;
    static int currentCount;
    static int maxCount;
    static DateTime start;
    static CancellationTokenSource? cancellation;
}

record JobBase(string Title, string SourcePath, string TargetPath, CopyFile Item, bool Move);

