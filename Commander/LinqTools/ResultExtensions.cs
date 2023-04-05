namespace LinqTools;


public static class ResultExtensions
{
    public static Task<T> GetOrDefaultAsync<T, TE>(this Task<Result<T, TE>> result, T defaultValue)
        where T : notnull
        where TE : notnull
        => result.MatchAsync(val => val, e => defaultValue);


}