using System.Threading.Channels;

static class BackgroundJobs
{
    public static bool IsIdle() => !jobs.Reader.TryPeek(out var _);

    static BackgroundJobs()
    {
        jobs = Channel.CreateUnbounded<JobBase>();
        jobProcessorTask = Task.Run(RunProcessing);
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
            // job.Cancellation?.ThrowIfCancellationRequested();

            // var result = await (job switch
            // {
            //     MonitorJob mj => proxy.AddPartnerInternalAsync(mj.SessionID, mj.Name),
            //     MonitorByExtensionJob mej => proxy.AddPartnerByExtensionInternalAsync(mej.SessionID, mej.Extension),
            //     MonitorByDeviceJob mdj => proxy.AddPublicMonitorDeviceInternalAsync(mdj.SessionID, mdj.Device, mdj.GeneratedGuid),
            //     _ => throw new InvalidOperationException()
            // });

            // job.Completion.TrySetResult(result);
        }
        catch (OperationCanceledException)
        {
//            job.Completion.TrySetCanceled();
        }
        catch (Exception e)
        {
//            job.Completion.TrySetException(e);
        }
    }


    static readonly Channel<JobBase> jobs;
    static readonly Task jobProcessorTask;
}

record JobBase();