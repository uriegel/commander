

public partial class Core
{
    public static T Try<T>(Func<T> func, Func<Exception, T> onException)
    {
        try 
        {
            return func();
        }
        catch (Exception e)
        {
            return onException(e);
        }
    }

    public static async Task<T> Try<T>(Func<Task<T>> func, Func<Exception, T> onException)
    {
        try 
        {
            return await func();
        }
        catch (Exception e)
        {
            return onException(e);
        }
    }

    public static async Task<T> Try<T>(Func<Task<T>> func, Func<Exception, Task<T>> onException)
    {
        try 
        {
            return await func();
        }
        catch (Exception e)
        {
            return await onException(e);
        }
    }
}