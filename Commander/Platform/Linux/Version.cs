#if Linux

static class FileVersion
{
    public static VersionInfo[] GetVersionItems(string path, IEnumerable<DirectoryItem> items, CancellationToken cancellation) => [];
}

#endif