record DirectoryItem(
    string Name,
    long Size,
    bool IsDirectory,
    string? IconPath,
    bool IsHidden,
    DateTime Time
);

record GetFiles(
    string Path,
    bool ShowHiddenItems
);

static class Directory
{
    public static async Task<DirectoryItem[]> GetFiles(GetFiles getFiles)
    {
        return Array.Empty<DirectoryItem>();
    }
}

