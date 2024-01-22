#if Windows

using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using static CsTools.Core;

static partial class CopyProcessor
{
    public static AsyncResult<Nothing, RequestError> CopyUac(UacCopyItemsParam input)
        => input
            .SideEffect(j => 
            {
                currentBytes = j.CurrentBytes;
                currentCount = j.CurrentCount;
            })
            .Items
            .Aggregate(Ok<Nothing, RequestError>(nothing),
                (r, i) => r.SelectMany(_ => Copy(new Job(
                    input.Move ? JobType.Move : JobType.Copy,
                    input.Path,
                    input.TargetPath,
                    i.Size, i.Name, i.SubPath, false, i.Time))
            ))
            .SideEffectWhenOk(_ => DeleteMovedDirs(input
                                                        .Items
                                                        .Select(n => input.Path.AppendPath(n.SubPath))
                                                        .Distinct()))
            .ToAsyncResult();

    public static AsyncResult<Nothing, RequestError> Cancel(Nothing nothing)
        => Ok<Nothing, RequestError>(nothing)
            .SideEffect(_ => PerformCancel())
            .ToAsyncResult();

    static void Cancel()
    {
        Requests.JsonRequest.Post<Nothing, Nothing>(new("commander/cancelcopy", nothing));
        PerformCancel();
    }

    static async Task ProcessError(RequestError err, Job job)
    {
        if (err.Status == (int)IOErrorType.AccessDenied)
        {
            var allJobs = new[] { job }.Concat((await GetCurrentJobs())
                                                    .Where(n => n.Path == job.Path && n.SubPath?.StartsWith(job.SubPath ?? "", StringComparison.CurrentCultureIgnoreCase) == true))
                                        .ToArray();
            (await UacServer
                .StartElevated()
                .SideEffect(_ => sseClient = new SseClient<Events>("http://localhost:21000/commander/sse", 
                                                e => Events.CopyProgressChanged(
                                                            new CopyProgress(e.CopyProgress!.FileName, e.CopyProgress.IsMove, totalCount, e.CopyProgress!.CurrentCount, 
                                                                startTime.HasValue ? (int)(DateTime.Now - startTime.Value).TotalSeconds : 0,
                                                                e.CopyProgress!.TotalFileBytes, e.CopyProgress!.CurrentFileBytes, totalBytes, e.CopyProgress!.CurrentBytes,
                                                                false, false))))
                .SelectError(_ => new RequestError(1099, "UAC not started"))
                .ToAsyncResult()
                .BindAwait(_ => Requests.JsonRequest.Post<UacCopyItemsParam, Nothing>(new(
                    "commander/copyitems",
                    new(
                        currentCount,
                        currentBytes,
                        job.JobType == JobType.Move,
                        job.Path,
                        job.TargetPath,
                        allJobs
                            .Select(n => new CopyItem(n.Item, null, n.Size, DateTime.MinValue, n.SubPath))
                            .ToArray()
                        ))))
                .SelectError(e => new RequestError(e.Status, e.StatusText))
                .SideEffectWhenErrorAwait(ProcessError)
                .ToResult())
                .SideEffectIf(res => !res.IsError && jobs.Reader.TryPeek(out var _) == false, 
                    _ => Clear())
                .SideEffect(_ => sseClient?.Dispose());
        }
        else
            await ProcessError(err);
    }

    static SseClient<Events>? sseClient;
}

record UacCopyItemsParam(
    int CurrentCount,
    long CurrentBytes,
    bool Move,
    string Path,
    string TargetPath,
    CopyItem[] Items
);

#endif