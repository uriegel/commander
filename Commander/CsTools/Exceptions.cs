namespace CsTools;

// TODO to CsTools
public static partial class Core
{
    public static T RepeatOnException<T>(Func<T> func, int repeatCount, TimeSpan? delay = null) 
    {
        try
        {
            return func();
        }
        catch 
        {
            if (repeatCount == 0)
                throw;
            if (delay.HasValue)
                Task.Delay(delay.Value);
            return RepeatOnException(func, repeatCount--, delay);
        }
    }
}