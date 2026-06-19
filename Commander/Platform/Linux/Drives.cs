#if Linux
using System.Text.Json;
using System.Text.Json.Serialization;
using CsTools.Async;
using CsTools.Extensions;
using Gtk4DotNet;
using static CsTools.ProcessCmd;

static class Drives
{
    public static async Task<RootItem[]> Get()
        => [new RootItem("~", "home", 0, CsTools.Directory.GetHomeDir(), true, "user-home", null, DriveType.HOME), ..
            from drive in JsonSerializer.Deserialize<DrivesResult>(
                                        await RunAsync("lsblk", "--json --bytes -o NAME,UUID,LABEL,FSTYPE,MOUNTPOINT,SIZE,TRAN,RM,FSUSE%"), Json.Defaults
                                    )?.Blockdevices
            where drive.Fstype != "squashfs"
            from child in drive.Children ?? [drive]
            orderby child.Mountpoint == null
            select new RootItem(
                child.Name,
                child.Label,
                child.Size,
                child.Mountpoint ?? "",
                child.Mountpoint?.Length > 0,
                (child.Tran ?? drive.Tran).GetIconName(child.Rm),
                child.Uuid,
                (child.Tran ?? drive.Tran).GetDriveType(child.Rm),
                child.Fsuse,
                child.Rm) ];

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

    public static void RemoveDrive(string mountPoint)
    {
        WebView.Window.BeginInvoke(async () =>
        {
            using var probeFile = GFile.New(mountPoint);
            using var mount = probeFile.FindEnclosingMount();
            using var vol = mount?.GetVolume();
            using var driv = vol?.GetDrive();
            if (driv == null)
                return;

            var dialog = AdwAlertDialog.New("Laufwerk entfernen", $"Möchtest Du dieses Laufwerk entfernen:\n{driv.Name}");
            dialog.SetResponses([
                    new("ok", "_Ok", Default: true, Appearance: AdwResponseAppearance.Suggested),
                    new("cancel", "_Abbrechen", Cancel: true)
                ]);
            var res = await dialog.PresentAsync(WebView.Window.Window);
            if (res == "cancel")
                return;

        });
    }

    public static void StartMonitoring()
    {
        volumeMonitor = VolumeMonitor.Get();
        volumeMonitor.OnDriveConnected(Refresh);
        volumeMonitor.OnDriveDisconnected(Refresh);
        volumeMonitor.OnMountAdded(Refresh);
        volumeMonitor.OnMountRemoved(Refresh);
        volumeMonitor.OnVolumeRemoved(Refresh);
    }

    public static void StopMonitoring() => volumeMonitor?.Dispose();

    static string GetIconName(this string? tran, bool removable)
        => (tran, removable) switch
        {
            ("sata", _) => "drive-harddisk-solidstate",
            ("usb", false) => "drive-harddisk-usb",
            ("usb", true) => "drive-removable-media-usb",
            _ => "drive-harddisk"
        };

    static string GetDriveType(this string? tran, bool removable)
        => (tran, removable) switch
        {
            ("sata", _) => DriveType.SATA,
            ("usb", false) => DriveType.HARDDRIVE_USB,
            ("usb", true) => DriveType.REMOVABLE_USB,
            _ => DriveType.HARDDRIVE
        };

    static void Refresh() => Requests.SendJson(new(null, EventCmd.RefreshDrives, new()));

    static VolumeMonitor? volumeMonitor;
}

record DrivesResult(Device[] Blockdevices);
record Device(
    Device[]? Children,
    string Name,
    string? Uuid,
    string Fstype,
    string Label,
    string? Mountpoint,
    long Size,
    string? Tran,
    [property: JsonPropertyName("fsuse%")]
    string? Fsuse,
    bool Rm);

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