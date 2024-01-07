using System.Threading.Channels;
using AspNetExtensions;
using CsTools;
using CsTools.Extensions;
using CsTools.Functional;

using static CsTools.Core;

static partial class CopyProcessor
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

    public static AsyncResult<Nothing, RequestError> CancelRequest()
        => Ok<Nothing, RequestError>(nothing)
            .SideEffect(_ => Cancel())
            .ToAsyncResult();
    
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
            await Process(job)
                .Match(
                    Bypass,
                    e => ProcessError(e, job));
    }

    static Result<Nothing, RequestError> Process(Job job)
    {
        try
        {
            Result<Nothing, RequestError>? result = null;
            if (!cancellationTokenSource.IsCancellationRequested)
                switch (job.JobType)
                {
                    case JobType.Copy:
                    case JobType.Move:
                        result = Copy(job);
                        break;
                    default:
                        break;
                }
            if (result?.IsError != true && jobs.Reader.TryPeek(out var _) == false)
                Clear();
            return result ?? Ok<Nothing, RequestError>(nothing);
        }
        catch (Exception e)
        {
            Console.WriteLine($"Exception occurred while copying: {e}");
            return Error<Nothing, RequestError>(IOErrorType.Exn.ToError());
        }
    }

    static Task Bypass(Nothing _)
        => Task.FromResult(0);

    static async Task ProcessError(RequestError err)
    {
        await GetCurrentJobs();
        Clear();
        Events.SendCopyError(err);
    }

    static Result<Nothing, RequestError> Copy(Job job) 
        => job.TargetPath
            .AppendPath(job.SubPath)
            .TryEnsureDirectoryExists()
            .SelectError(Directory.ErrorToRequestError)
            .SelectMany(target => Directory.Copy(job.Item, job.Path.AppendPath(job.SubPath), job.TargetPath.AppendPath(job.SubPath),
                (c, t) => Events.CopyProgressChanged(
                    new(job.Item, totalCount, currentCount + 1, startTime.HasValue ? (int)(DateTime.Now - startTime.Value).TotalSeconds : 0, 
                    t, c, totalBytes, currentBytes + c, false, false)),
                job.JobType == JobType.Move, cancellationTokenSource.Token))
            .SideEffectWhenOk(_ =>
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

    static Task<Job[]> GetCurrentJobs(Func<Job, bool>? predicate = null)
    {
        async IAsyncEnumerable<Job> GetCurrentJobs()
        {
            while (true)
                if (jobs.Reader.TryPeek(out var job) != false) {
                    if (predicate == null || predicate(job))
                        yield return await jobs.Reader.ReadAsync();
                }
                else
                    break;
        }
        return GetCurrentJobs()
            .ToArrayAsync()
            .AsTask();
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

// TODO When move create cleanupEmptyDirectories job
// TODO When move create cleanupEmptyDirectories job (UAC)
// TODO Window closing when copy processes are running: Show Copy Process 
// TODO get copy or move operation (dialog in Windows)

// as param new HashSet<string>()

// param HashSet<string> newDirs

// EnsurePathExists(input.TargetPath, n.SubPath, newDirs);

// static void EnsurePathExists(string path, string? subPath, HashSet<string> dirs)
// {
//     if (subPath != null&& !dirs.Contains(subPath))
//     {
//         var targetPath = path.AppendPath(subPath);
//         if (!System.IO.Directory.Exists(targetPath))
//             System.IO.Directory.CreateDirectory(targetPath);
//         dirs.Add(subPath);
//     }
// }   

// .SideEffect(n =>
//             {
//                 if (input.Move)
//                     foreach (var dir in newDirs)
//                     {
//                         try
//                         {
//                             Delete(input.Path.AppendPath(dir));
//                         }
//                         catch { }
//                     };
//             })
