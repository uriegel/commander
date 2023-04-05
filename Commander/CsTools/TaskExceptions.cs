namespace CsTools;

public static class TaskExtensions
{
    public static async Task<T> Catch<T>(this Task<T> t, Func<Exception, Task<T>> onException)
    {
        try
        {
            return await t;
        }
        catch (Exception e)
        {
            return await onException(e);
        }
    }

    public static async Task<T> Catch<T>(this Task<T> t, Func<Exception, T> onException)
    {
        try
        {
            return await t;
        }
        catch (Exception e)
        {
            return onException(e);
        }
    }
}
