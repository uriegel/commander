#if Windows

static class Drive
{
    public static async Task<DriveItem[]> Get()
    {
        return [];
    }
}

record DriveItem(
    string Name,
    string Description,
    long Size,
    string MountPoint,
    bool IsMounted,
    string DriveType,
    string Type = "HARDDRIVE" // TODO: Drive types
);
record DriveItemResponse(DriveItem[] Items, string Path, int DirCount);

enum DriveType
{
    UNKNOWN,
    HARDDRIVE,
    ROM,
    REMOVABLE,
    NETWORK,
    HOME
}
#endif