using System.Collections.Concurrent;
using LinqTools;
using Microsoft.AspNetCore.Mvc.Diagnostics;

static class CopyProcessor
{
    public static Task<IOResult> AddItems(CopyItemsParam input)
        
        
        // TODO

        // Update copy info

        // clear copy info when all jobs are finished







        => IOResult
            .NoError()
            .SideEffect(_ => fileCount += input.Items.Length)
            .SideEffect(_ => completeSize += input.Items.Select(n => n.Size).Aggregate(0L, (a, b) => a + b)) 
            .SideEffect(_ => Events.CopyStarted())
            .SideEffect(_ => input.Items.SideEffectForAll(n => InsertCopyItem(input.Path, input.TargetPath, input.Move, n)))
            .ToAsync();

    static void InsertCopyItem(string path, string targetPath, bool move, CopyItem item)
        => jobs.Enqueue(new(move ? JobType.Move : JobType.Copy, path, targetPath, item.Size, item.Name, item.SubPath, false));

    static int fileCount;
    static int currentFileCount;
    static long currentSize;
    static long completeSize;

    static readonly ConcurrentQueue<Job> jobs = [];
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
// TODO Exceptions are collected and shown in the UI
// TODO Esc to cancel (all or some) requests
// TODO Update the view which contains new (or removed) items (background color)
// TODO They inform about the current state and errors
// TODO get copy or move operation (dialog in Windows)
// TODO Windows close (not cancel) copy progress
// TODO Linux cancel copy progress
