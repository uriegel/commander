#if Windows

static class Drive
{
    public static async Task<RootItem[]> Get() =>
        [ new RootItem(Globals.HomeDir, "Start", 0, "", true, DriveType.Home),
            .. DriveInfo
                .GetDrives()
                .Select(Create)];

    static RootItem Create(DriveInfo info)
        => info.IsReady
            ? new(info.Name, info.VolumeLabel, info.TotalSize, "", true)
            : new(info.Name, "Not ready", 0, "", false);

    public static async Task<string> Mount(string device) => return "";
}

#endif