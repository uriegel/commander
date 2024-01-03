#if Linux

static partial class CopyProcessor
{
    static Task ProcessError(RequestError err, Job job)
        => ProcessError(err);
}

#endif