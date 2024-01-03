#if Windows

using AspNetExtensions;

static partial class CopyProcessor
{
    static async Task ProcessError(RequestError err, Job job)
    {
        if (err.Status == (int)IOErrorType.AccessDenied)
        {
            var allJobs = new[] { job }.Concat(await GetCurrentJobs(n => n.Path == job.Path && n.SubPath == job.SubPath));

            // TODO send one request with all files to uac, new Request!!!
            // TODO send Progress from uac



        }
        else
            await ProcessError(err);
    }
}

#endif