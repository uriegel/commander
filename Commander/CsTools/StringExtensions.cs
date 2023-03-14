public static class StringExtensions
{
    public static string? WhiteSpaceToNull(this string? str)
        => string.IsNullOrWhiteSpace(str) ? null : str;

    public static long? ParseLong(this string? str)
        => long.TryParse(str, out var val)
            ? val
            : null;

}