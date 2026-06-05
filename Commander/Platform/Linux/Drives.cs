#if Linux
using System.Text.Json;
using CsTools.Async;
using CsTools.Extensions;
using static CsTools.ProcessCmd;

static class Drive
{
    // TODO get drive type for icon
    // TODO UUID

    public static async Task<RootItem[]> Get()
        => [new RootItem("~", "home", 0, CsTools.Directory.GetHomeDir(), true, DriveType.Home), ..
            from drive in JsonSerializer.Deserialize<Drives>(
                                        await RunAsync("lsblk", "--json --bytes -o NAME,UUID,LABEL,FSTYPE,MOUNTPOINT,SIZE,TRAN"), Json.Defaults
                                    )?.Blockdevices
            where drive.Fstype != "squashfs"
            from child in drive.Children ?? [drive]
            orderby child.Mountpoint == null
            select child.Tran != null
                ? new RootItem(child.Name, child.Label, child.Size, child.Mountpoint ?? "", child.Mountpoint?.Length > 0)
                : new RootItem(child.Name, child.Label, child.Size, child.Mountpoint ?? "", child.Mountpoint?.Length > 0)];
                //Root(child.Name, child.Uuid, child.Fstype, child.Label, child.Mountpoint, child.Size, drive.Tran ?? "");

    public static async Task<string> Mount(string device)
    {
        try
        {
            var output = await RunAsync("udisksctl", $"mount -b /dev/{device}");
            return output.SubstringAfter(" at ").Trim();
        }
        catch (Exception e)
        {
            if (e.Message.Contains("already mounted"))
                throw new AlreadyMountedException();
            else
                throw new MountException(e.Message);
        }
    }
}

record Drives(Device[] Blockdevices);
record Device(Device[]? Children, string Name, string? Uuid, string Fstype, string Label, string? Mountpoint, long Size, string? Tran);
record Root(string Name, string? Uuid, string Fstype, string Label, string? Mountpoint, string Size, string Tran);

#endif

/*
public static async Task<RootItem[]> Get2()
{
    var items = await
        (from n in RunAsync("lsblk", "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE")
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
         select
             (from n in driveLines
                     .Skip(1)
                     .Append("home")
              let item = CreateRootItem(n, columnPositions)
              orderby item.IsMounted descending, item.Name
              select item)
             .ToArray());
    return [.. items.Where(n =>
                !n.MountPoint.StartsWith("/snap")
                && !items.Any(i => i.Name != n.Name && i.Name.StartsWith(n.Name))
            )];

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
                DriveType.Home)
            : new(
                GetString(1, 2).TrimName(),
                GetString(2, 3),
                GetString(0, 1)
                    .ParseLong()
                    ?? 0,
                mountPoint,
                mountPoint.Length > 0,
                DriveType.Harddrive
            //driveString[columnPositions[4]..].Trim()
            );

        string GetString(int pos1, int pos2)
            => driveString[columnPositions[pos1]..columnPositions[pos2]].Trim();
    }
    static string TrimName(this string name)
        => name.Length > 2 && name[1] == '─'
        ? name[2..]
        : name;
    // static bool FilterDrives(this string driveString, int[] columnPositions) => 
    //     driveString == "home"
    //     //|| driveString[columnPositions[1]] > '~';
    //     || driveString[columnPositions[3].start];
}
*/