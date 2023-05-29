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
//                        .Append("remotes")
//                        .Append("fav")
            orderby n.IsReady descending, n.Name
            let item = RootItem.Create(n)
            select item.Name == "zzzz" 
                ? item with { Name = "remotes" } 
                : item.Name == "zzz" 
                ? item with { Name = "fav" }
                : item)
            .ToArray()
            .ToAsync();
}

#endif