#if Windows

static class Drive
{
    public static async Task<RootItem[]> Get() =>
        [ new RootItem(Globals.HomeDir, "Start", 0, "", true, "user-home", null, DriveType.HOME),
            .. DriveInfo
                .GetDrives()
                .Select(Create)];

    static RootItem Create(DriveInfo info)
        => info.IsReady
            ? new(info.Name, info.VolumeLabel, info.TotalSize, "", true, info.Name != @"C:\" ? "drive-harddisk" : "drive-windows")
            : new(info.Name, "Not ready", 0, "", false, info.DriveType == System.IO.DriveType.Removable ? "drive-removable-media-usb" : "drive-harddisk");

    public static async Task<string> Mount(string device) => "";
}

#endif