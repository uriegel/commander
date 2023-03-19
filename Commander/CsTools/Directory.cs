using static CsTools.Functional.Memoization;

// TODO to CsTools

namespace CsTools;

public static class Directory
{
    public static Func<string> GetHomeDir { get; }

    static Directory()
    {
        GetHomeDir = Memoize(InitHomeDir);
    }

    static string InitHomeDir()
        => System.Environment.GetFolderPath(System.Environment.SpecialFolder.Personal);

    /// <summary>
    /// Creates a file from this path
    /// </summary>
    /// <param name="path"></param>
    /// <returns></returns>
    public static Stream OpenFile(this string path)
        => File.OpenRead(path);
}
