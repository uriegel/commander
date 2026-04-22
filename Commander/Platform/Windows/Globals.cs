#if Windows

static partial class Globals
{
    public static void InitializeResourceFiles() { }

    public static string HomeDir { get; } = System.IO.Directory.GetParent(Environment.GetFolderPath(Environment.SpecialFolder.Personal))!.FullName;
}

#endif
