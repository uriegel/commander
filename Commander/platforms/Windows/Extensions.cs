using LinqTools;

static class StringExtensions
 {
    public static string RemoveWriteProtection(this string file)
        => file.SideEffect(n =>  (new FileInfo(n)).IsReadOnly = false);
 }