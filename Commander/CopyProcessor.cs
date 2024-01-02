using System.Threading.Channels;
using AspNetExtensions;
using CsTools;
using CsTools.Extensions;
using CsTools.Functional;

using static CsTools.Core;

static class CopyProcessor
{
    public static AsyncResult<Nothing, RequestError> AddItems(CopyItemsParam input)
    {
        cancellationTokenSource = new();
        totalCount += input.Items.Length; 
        totalBytes += input.Items.Select(n => n.Size).Aggregate(0L, (a, b) => a + b);
        if (!startTime.HasValue)
            startTime = DateTime.Now;
        Events.CopyStarted();
        input.Items.ForEach(n => InsertCopyItem(input.Path, input.TargetPath, input.Move, n));
        return Ok<Nothing, RequestError>(nothing)
            .ToAsyncResult();
    }

    public static void Cancel()
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
            Process(job);
    }

    static void Process(Job job)
    {
        try
        {
            if (!cancellationTokenSource.IsCancellationRequested)
                switch (job.JobType)
                {
                    case JobType.Copy:
                    case JobType.Move:
                        Copy(job);
                        break;
                    default:
                        break;
                }
            if (jobs.Reader.TryPeek(out var _) == false)
                Clear();
        }
        catch
        {
            // TODO error handling or complete ROP
        }
    }

    static void Copy(Job job) 
        => job.TargetPath
            .AppendPath(job.SubPath)
            .TryEnsureDirectoryExists()
            .SelectError(Directory.ErrorToIOError)
            .SelectMany(target => Directory.Copy(job.Item, job.Path.AppendPath(job.SubPath), job.TargetPath,
                (c, t) => Events.CopyProgressChanged(
                    new(job.Item, totalCount, currentCount + 1, startTime.HasValue ? (int)(DateTime.Now - startTime.Value).TotalSeconds : 0, t, c, totalBytes, currentBytes + c, false, false)),
                job.JobType == JobType.Move, cancellationTokenSource.Token))
            .SideEffect(_ =>
            {
                currentCount++;
                currentBytes += job.Size;
            });

    static void InsertCopyItem(string path, string targetPath, bool move, CopyItem item)
        => jobs.Writer.TryWrite(new(move ? JobType.Move : JobType.Copy, path, targetPath, item.Size, item.Name, item.SubPath, false));

    static void Clear()
    {
        totalCount = 0;
        totalBytes = 0;
        startTime = null;
        currentCount = 0;
        currentBytes = 0;
        Events.CopyFinished();
    }

    static CopyProcessor() => Process();

    static int totalCount;
    static long totalBytes;
    static DateTime? startTime;

    static int currentCount;
    static long currentBytes;
    static readonly Channel<Job> jobs = Channel.CreateUnbounded<Job>();
    static CancellationTokenSource cancellationTokenSource = new();
}

enum JobType
{
    Copy,
    Move,
    CopyToRemote,
    MoveToRemote, //?
    CopyFromRemote,
    MoveFromRemote, //?
    CleanUpEmptyDirs
}

record Job(
    JobType JobType,
    string Path, 
    string TargetPath, 
    long Size,
    string Item,
    string? SubPath,
    bool IsCancelled
);

// TODO Copy when a file is already there with different size
// TODO Dialog custom names for buttons
// TODO Windows Cancel close Progress 
// TODO When move create cleanupEmptyDirectories job
// TODO Exceptions are collected and shown in the UI
// TODO Exception: Dialog what to do: cancel, ignore this , ignore all
// TODO Update the view which contains new (or removed) items (background color)
// TODO They inform about the current state and errors
// TODO get copy or move operation (dialog in Windows)
// TODO Windows close (not cancel) copy progress
// TODO Linux cancel copy progress

    // static Task<IOResult> CopyItems(int totalCount, long totalSize, CopyItemsParam input,
    //     HashSet<string> newDirs, CancellationToken cancellationToken)
    //     => input
    //         .Items
    //         .SideEffect(_ => Events.CopyStarted())
    //         .Aggregate(new FileCopyAggregateItem(0L, 0, DateTime.Now), (fcai, n) =>
    //         {
    //             if (cancellationToken.IsCancellationRequested)
    //                 return new(0, 0, DateTime.Now);
    //             var targetPath = input.TargetPath.AppendPath(n.SubPath);
    //             EnsurePathExists(input.TargetPath, n.SubPath, newDirs);
    //             CopyItem(n.Name, input.Path.AppendPath(n.SubPath), targetPath,
    //                 (c, t) => Events.CopyProgressChanged(
    //                     new(n.Name, totalCount, fcai.Count + 1, (int)(DateTime.Now - fcai.StartTime).TotalSeconds, t, c, totalSize, fcai.Bytes + c, false, false)),
    //                 input.Move, cancellationToken);
    //             return new(fcai.Bytes + n.Size, fcai.Count + 1, fcai.StartTime);
    //         })
    //         .SideEffect(n =>
    //         {
    //             if (input.Move)
    //                 foreach (var dir in newDirs)
    //                 {
    //                     try
    //                     {
    //                         Delete(input.Path.AppendPath(dir));
    //                     }
    //                     catch { }
    //                 };
    //         })
    //         .SideEffect(_ => Events.CopyFinished())
    //         .ToIOResult();
