using System.Threading.Channels;

static class BackgroundJobs
{
    public static bool IsIdle() => !jobs.Reader.TryPeek(out var _);

    public async static Task AddJobAsync(CopyInput input)
    {
        await foreach(var item in input.Items.ToAsyncEnumerable())
            await jobs.Writer.WriteAsync(new(input.SourcePath, input.TargetPath, item, input.Move));
    }

    static BackgroundJobs()
    {
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
        try
        {
            await foreach (var n in jobs.Reader.ReadAllAsync())
                await Process(n);
        }
        catch (Exception e)
        {
            Console.Error.WriteLine($"Exception in background processing: {e}");
        }
    }
    
    static async Task Process(JobBase job)
    {
        try
        {
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
    }


    static readonly Channel<JobBase> jobs;
    static readonly Task jobProcessorTask;
}

record JobBase(string SourcePath, string TargetPath, CopyFile Item, bool Move);

