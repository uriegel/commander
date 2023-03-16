#if Linux
using CsTools.Extensions;
using LinqTools;

using static CsTools.ProcessCmd;

record RootItem(
    string Name,
    string Description,
    long Size,
    string MountPoint,
    bool IsMounted,
    string DriveType
);

static class Root
{
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
                                    .Append("home")
                                    .Append("remotes")
                        where n.FilterDrives(columnPositions)
                        let item = CreateRootItem(n, columnPositions)
                        orderby item.IsMounted descending, item.Name
                        select item.Select(n => n.Name == "zzz" ? n with { Name = "remotes" }: n))
                    .ToArray())
            .GetOrThrow();

        RootItem CreateRootItem(string driveString, int[] columnPositions)
        {
            var mountPoint = driveString != "home" && driveString != "remotes" ? GetString(3, 4) : "";

            return driveString == "home"
                ? new(
                    "~", 
                    "home",
                    0,
                    Directory.GetHomeDir(),
                    true,
                    "")
                : driveString == "remotes"
                ? new(
                    "zzz", 
                    "Zugriff auf entfernte Geräte",
                    0,
                    "",
                    true,
                    "")
                : new(
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

    static bool FilterDrives(this string driveString, int[] columnPositions) => 
        driveString != "home" && driveString != "remotes" 
        ? driveString[columnPositions[1]] > '~'
        : true;
}

#endif