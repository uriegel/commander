using CsTools.Extensions;
using LinqTools;
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
        var driveLines = (await CsTools.Process.RunCmdAsync("lsblk", "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE"))
            .Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var titles = driveLines[0];

        var positions = new[]
            {
                0,
                GetPart(titles, "NAME"),
                GetPart(titles, "LABEL"),
                GetPart(titles, "MOUNT"),
                GetPart(titles, "FSTYPE")
            };

        return driveLines
                .Skip(1)
                .Select(CreateRootItem)
                .ToArray();

        RootItem CreateRootItem(string driveString)
        {
            var mountPoint = GetString(3, 4);
            return new(
                GetString(1, 2),
                GetString(2, 3),
                GetString(0, 1)
                    .ParseLong()
                    .GetOrDefault(0),
                mountPoint,
                mountPoint.Length > 0,
                driveString[(positions[4])..]
                    .Trim()
            );

            string GetString(int pos1, int pos2)
                => driveString[positions[pos1]..positions[pos2]].Trim();
        }

        int GetPart(string title, string key)
            => title.IndexOf(key);
    }
    

#endif
}