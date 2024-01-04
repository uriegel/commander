#if Windows

using AspNetExtensions;
using CsTools.Extensions;
using CsTools.Functional;
using static CsTools.Core;

static partial class CopyProcessor
{
    // TODO 
        //     totalCount = 0;
        // totalBytes = 0;
        // startTime = null;
        // currentCount = 0;
        // currentBytes = 0;

    // TODO Cancel jobs in uac


    public static AsyncResult<Nothing, RequestError> CopyUac(CopyItemsParam input)
        => input
            .Items
            .Aggregate(Ok<Nothing, RequestError>(nothing),
                (r, i) => r.SelectMany(_ => Copy(new Job(
                    input.Move ? JobType.Move : JobType.Copy,
                    input.Path,
                    input.TargetPath,
                    0, i.Name, i.SubPath, false))))
            .ToAsyncResult();

    static async Task ProcessError(RequestError err, Job job)
    {
        if (err.Status == (int)IOErrorType.AccessDenied)
        {
            var allJobs = new[] { job }.Concat(await GetCurrentJobs(n => n.Path == job.Path && n.SubPath == job.SubPath));
            (await UacServer
                .StartElevated()
                .SideEffect(_ => sseClient = new CsTools.HttpRequest.SseClient<Events>("http://localhost:21000/commander/sse", e => Console.WriteLine($"Events From Uac: {e}")))
                .SelectError(_ => new CsTools.HttpRequest.RequestError(1099, "UAC not started"))
                .ToAsyncResult()
                .BindAwait(_ => Requests.JsonRequest.Post<CopyItemsParam, Nothing>(new(
                    "commander/copyitems",
                    new(
                        job.Path,
                        job.TargetPath,
                        allJobs
                            .Select(n => new CopyItem(n.Item, null, 0, DateTime.MinValue, n.SubPath))
                            .ToArray(),
                        job.JobType == JobType.Move))))
                .SelectError(e => new RequestError(e.Status, e.StatusText))
                .ToResult())
                .SideEffect(_ => sseClient?.Dispose());
        }
        else
            await ProcessError(err);
    }

    static CsTools.HttpRequest.SseClient<Events>? sseClient;
}

#endif