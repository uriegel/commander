#if Windows
using LinqTools;

record RootItem(
    string Name,
    string? Description,
    long? Size,
    bool IsMounted
)
{
    public static RootItem Create(DriveInfo driveInfo)
        => new(
            driveInfo.Name,
            driveInfo.IsReady ? driveInfo.VolumeLabel : null,
            driveInfo.IsReady ? driveInfo.TotalSize : null,
            driveInfo.IsReady);   
};

static class Root
{
    // TODO append home drive
    public static Task<RootItem[]> Get(Empty _)
        =>  (from n in DriveInfo
                        .GetDrives()
            orderby n.IsReady descending, n.Name
            select RootItem.Create(n))
                .ToArray()
                .ToAsync();
}

#endif