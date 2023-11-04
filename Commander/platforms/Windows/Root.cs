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
    public static Task<RootItem[]> Get(Empty _)
        =>  (from n in DriveInfo
                        .GetDrives()
                        .Select(RootItem.Create)
                        .Append(new("zzz", "", 0, true))
            orderby n.IsMounted descending, n.Name
            select n.Name == "zzz" 
                ? n with { Name = "services" } 
                : n)
            .ToArray()
            .ToAsync();
}

#endif