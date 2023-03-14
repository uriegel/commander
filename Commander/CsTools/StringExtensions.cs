public static class StringExtensions
{
    public static string? WhiteSpaceToNull(this string? str)
        => string.IsNullOrWhiteSpace(str) ? null : str;
}