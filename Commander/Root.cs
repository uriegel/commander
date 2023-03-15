using CsTools;
using CsTools.Extensions;
using LinqTools;

#if Linux
using static CsTools.ProcessCmd;

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
        return (from n in await RunAsync("lsblk", "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE")
                let driveLines = n.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                let titles = driveLines[0]
                let columnPositions = new[]
                {
                    0,
                    titles.IndexOf("NAME"),
                    titles.IndexOf("LABEL"),
                    titles.IndexOf("MOUNT"),
                    titles.IndexOf("FSTYPE")
                }
                select (from n in driveLines
                                    .Skip(1)
                        where n.FilterDrives(columnPositions)
                        let item = CreateRootItem(n, columnPositions)
                        orderby item.IsMounted descending, item.Name
                        select item)
                    .ToArray())
            .GetOrThrow();

        RootItem CreateRootItem(string driveString, int[] columnPositions)
        {
            var mountPoint = GetString(3, 4);

            return new(
                GetString(1, 2).TrimName(),
                GetString(2, 3),
                GetString(0, 1)
                    .ParseLong()
                    .GetOrDefault(0),
                mountPoint,
                mountPoint.Length > 0,
                driveString[(columnPositions[4])..]
                    .Trim()
            );

            string GetString(int pos1, int pos2)
                => driveString[columnPositions[pos1]..columnPositions[pos2]].Trim();
        }
    }

    static string TrimName(this string name)
        => name.Length > 2 && name[1] == '─'
        ? name[2..]
        : name;

    static bool FilterDrives(this string str, int[] columnPositions) => str[columnPositions[1]] > '~';

#endif
}