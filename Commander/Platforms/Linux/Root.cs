#if Linux
using CsTools.Extensions;
using CsTools.Async;
using CsTools.Functional;

using static CsTools.Core;
using static CsTools.ProcessCmd;
using CsTools.HttpRequest;

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
    public static AsyncResult<RootItem[], RequestError> Get()
    {
        return (
            from n in RunAsync("lsblk", "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE")
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
            select Ok<RootItem[], RequestError>(
                [.. from n in driveLines
                        .Skip(1)
                        .Append("home")
                    where n.FilterDrives(columnPositions)
                    let item = CreateRootItem(n, columnPositions)
                    orderby item.IsMounted descending, item.Name
                    select item]))
                .ToAsyncResult();

        RootItem CreateRootItem(string driveString, int[] columnPositions)
        {
            var mountPoint = driveString != "home"
                ? GetString(3, 4) 
                : "";

            return driveString == "home"
                ? new(
                    "~", 
                    "home",
                    0,
                    CsTools.Directory.GetHomeDir(),
                    true,
                    "")
                : new(
                    GetString(1, 2).TrimName(),
                    GetString(2, 3),
                    GetString(0, 1)
                        .ParseLong() 
                        ?? 0,
                    mountPoint,
                    mountPoint.Length > 0,
                    driveString[columnPositions[4]..]
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
        driveString == "home"
        || driveString[columnPositions[1]] > '~';
}

#endif