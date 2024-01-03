#if Windows

using AspNetExtensions;
using CsTools.Functional;
using static CsTools.Core;

static partial class CopyProcessor
{
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
            UacServer
                .StartElevated()
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
                .SelectError(e => new RequestError(e.Status, e.StatusText));
            // TODO send Progress from uac
        }
        else
            await ProcessError(err);
    }
}

#endif