using LinqTools;

static class Cancellation
{
    public static void Cancel(object? _ = null) =>
        cancellationTokenSource
            .SideEffect(n => n?.Cancel())
            .SideEffect(n => n = null);
    public static CancellationToken Create()
        => new CancellationTokenSource()
                .SideEffect(n => cancellationTokenSource = n)
                .Token;
    static CancellationTokenSource? cancellationTokenSource;
}