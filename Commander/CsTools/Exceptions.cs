namespace CsTools;

// TODO to CsTools
public static partial class Core
{
    public static T RepeatOnException<T>(Func<T> func, int repeatCount) 
    {
        try
        {
            return func();
        }
        catch 
        {
            if (repeatCount == 0)
                throw;
            return RepeatOnException(func, repeatCount--);
        }
    }

    public static async Task<T> RepeatOnException<T>(Func<Task<T>> func, int repeatCount, TimeSpan? delay = null) 
    {
        try
        {
            return await func();
        }
        catch 
        {
            if (repeatCount == 0)
                throw;
            if (delay.HasValue)
                await Task.Delay(delay.Value);
            return await RepeatOnException(func, repeatCount--, delay);
        }
    }
}