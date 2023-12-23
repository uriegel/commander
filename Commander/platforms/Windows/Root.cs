#if Windows
using AspNetExtensions;
using CsTools.Extensions;
using CsTools.Functional;

using static CsTools.Core;

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
    public static AsyncResult<RootItem[], RequestError> Get()
        =>  Ok<RootItem[], RequestError>((from n in DriveInfo
                        .GetDrives()
                        .Select(RootItem.Create)
                        .Append(new("zzz", "", 0, true))
            orderby n.IsMounted descending, n.Name
            select n.Name == "zzz" 
                ? n with { Name = "services" } 
                : n).ToArray())
            .ToAsync()
            .ToAsyncResult();
}

#endif