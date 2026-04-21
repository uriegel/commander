#if Windows

static partial class Globals
{
    public static void InitializeResourceFiles() { }

    public static string HomeDir { get; } = Directory.GetParent(Environment.GetFolderPath(Environment.SpecialFolder.Personal))!.FullName;
}

#endif
