using static CsTools.Functional.Memoization;

public static class Directory
{
    public static Func<string> GetHomeDir { get; }

    static Directory()
    {
        GetHomeDir = Memoize(InitHomeDir);
    }

    static string InitHomeDir()
        => System.Environment.GetFolderPath(System.Environment.SpecialFolder.Personal);
}
