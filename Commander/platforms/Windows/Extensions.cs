using CsTools.Extensions;

static class StringExtensions
 {
    public static string RemoveWriteProtection(this string file)
        => file.SideEffect(n => {
            var fi = new FileInfo(n);
            if (fi.Exists)
                fi.IsReadOnly = false;
        });
         
 }