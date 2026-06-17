#if Windows

static class Drives
{
    public static async Task<RootItem[]> Get() =>
        [ new RootItem(Globals.HomeDir, "Start", 0, "", true, "user-home", null, DriveType.HOME),
            .. DriveInfo
                .GetDrives()
                .Select(Create)];

    public static async Task<string> Mount(string device) => "";

    static RootItem Create(DriveInfo info)
        => info.IsReady
            ? new(info.Name, info.VolumeLabel, info.TotalSize, "", true, info.GetIconName(), null, DriveType.HARDDRIVE, info.GetUse())
            : new(info.Name, "Not ready", 0, "", false, info.GetIconName());

    static string GetUse(this DriveInfo info)
        => $"{((float)info.TotalSize - info.TotalFreeSpace) / info.TotalSize * 100}%";

    static string GetIconName(this DriveInfo info)
        => info.Name == @"C:\"
            ? "drive-windows"
            : info.DriveType == System.IO.DriveType.Removable
            ? "drive-removable-media-usb"
            : "drive-harddisk";
}

#endif