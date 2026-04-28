using System.Threading.Channels;

static class BackgroundJobs
{
    public static bool IsIdle() => !jobs.Reader.TryPeek(out var _) && inProcess.CurrentCount == 1;

    public async static Task AddJobAsync(CopyInput input)
    {
        await foreach(var item in input.Items.ToAsyncEnumerable())
            await jobs.Writer.WriteAsync(new(input.SourcePath, input.TargetPath, item, input.Move));
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
        try
        {
            if (ProgressContext.Instance.CopyProgress == null)
                ProgressContext.Instance.CopyProgress = new CopyProgress();
            await Directory.CopyAsync(job);
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
                ProgressContext.Instance.CopyProgress = null;

        }
    }


    static readonly Channel<JobBase> jobs;
    static readonly Task jobProcessorTask;
    static readonly SemaphoreSlim inProcess;
}

record JobBase(string SourcePath, string TargetPath, CopyFile Item, bool Move);

