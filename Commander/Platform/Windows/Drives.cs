#if Windows

static class Drive
{
    public static async Task<DriveItem[]> Get() =>
        [ new DriveItem(Globals.HomeDir, "Start", 0, true, "", "HOME"),
            .. DriveInfo
                .GetDrives()
                .Select(DriveItem.Create)];
}

record DriveItem(
    string Name,
    string Description,
    long Size,
    bool IsMounted,
    string DriveType,
    string Type = "HARDDRIVE") // TODO: Drive types
{
    public static DriveItem Create(DriveInfo info)
        => new(info.Name, info.VolumeLabel, info.TotalSize, true, "disk");
};
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