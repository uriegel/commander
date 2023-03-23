namespace LinqTools;

public static class Extensions
{
    /// <summary>
    /// If a value is null, call function 'elseWith' and take that value, otherwise take the first value
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="t"></param>
    /// <param name="getOr"></param>
    /// <returns></returns>
    public static T? OrElseWith<T>(this T? t, Func<T?> elseWith)
        where T : class
        => t != null
            ? t
            : elseWith();
}