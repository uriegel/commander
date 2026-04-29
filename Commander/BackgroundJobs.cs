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
            await jobs.Writer.WriteAsync(new(input.Move ? "Verschieben" : "Kopieren", input.SourcePath, input.TargetPath, item, input.Move));
        }
    }

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
    }

    static async Task Process(JobBase job)
    {
        void OnProgress(long curr, long max) 
            => ProgressContext.Instance.CopyProgress = new(job.Title, job.Item.Name, totalMaxBytes, totalCurrentBytes, job.Item.Size, curr, true);

        try
        {
            if (ProgressContext.Instance.CopyProgress == null)
                ProgressContext.Instance.CopyProgress = new(job.Title, job.Item.Name, totalMaxBytes, totalCurrentBytes, job.Item.Size, 0, true);
#if Linux                
            await Directory.CopyAsync(job, OnProgress);
            Interlocked.Add(ref totalCurrentBytes, job.Item.Size);
#endif            
            // job.Cancellation?.ThrowIfCancellationRequested();

            // job.Completion.TrySetResult(result);
        }
        catch (OperationCanceledException)
        {
            //            job.Completion.TrySetCanceled();
        }
        catch (Exception)
        {
            //            job.Completion.TrySetException(e);
        }
        finally
        {
            if (!jobs.Reader.TryPeek(out var _))
            {
                totalCurrentBytes = 0;
                totalMaxBytes = 0;
                if (ProgressContext.Instance.CopyProgress != null)
                {
                    ProgressContext.Instance.CopyProgress = ProgressContext.Instance.CopyProgress with { IsRunning = false };
                    Requests.SendJson(new(null, "CopyStop", new()));
                    CleanupDelay();
                }
            }

            async void CleanupDelay()
            {
                await Task.Delay(5000);
                if (ProgressContext.Instance.CopyProgress?.IsRunning != true)
                    ProgressContext.Instance.CopyProgress = null;
            }
        }
    }

    static readonly Channel<JobBase> jobs;
    static readonly Task jobProcessorTask;
    static readonly SemaphoreSlim inProcess;
    static long totalCurrentBytes;
    static long totalMaxBytes;
}

record JobBase(string Title, string SourcePath, string TargetPath, CopyFile Item, bool Move);

