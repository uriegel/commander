#if Linux

using AspNetExtensions;
using CsTools.HttpRequest;

static partial class CopyProcessor
{
    public static void Cancel() => PerformCancel();

    static Task ProcessError(RequestError err, Job _)
        => ProcessError(err);

}

#endif