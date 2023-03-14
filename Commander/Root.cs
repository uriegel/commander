#if Linux

record RootItem(
    string Name,
    string Description,
    long Size,
    string MountPoint,
    bool IsMounted,
    string DriveType
);

#endif

static class Root
{
#if Linux
    public static async Task<RootItem[]> Get(Empty _)
    {
        var result = await CsTools.Process.RunAsync("lsblk", "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE");
        return Array.Empty<RootItem>(); 
    }
    

#endif
}