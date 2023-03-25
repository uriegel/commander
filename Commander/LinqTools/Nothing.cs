public struct Nothing { }

public static class NothingExtensions
{
    public static Nothing ToNothing<T>(this T _)
        => empty;

    static Nothing empty = new Nothing();
}

public static partial class Core
{
    public static Nothing ToNothing(Action action)
    {
        action();
        return 0.ToNothing();
    }

    public static async Task<Nothing> ToNothing(Func<Task> asyncAction)
    {
        await asyncAction();
        return 0.ToNothing();
    }
}