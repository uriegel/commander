enum PathKind
{
    Local,
    Unc,
    MappedNetworkDrive
}

static class PathKindHelper
{
    public static PathKind GetPathKind(this string path)
    {
        if (Uri.TryCreate(path, UriKind.Absolute, out var uri) && uri.IsUnc)
            return PathKind.Unc;

        string? root = Path.GetPathRoot(path);

        if (!string.IsNullOrEmpty(root))
        {
            var drive = new DriveInfo(root);

            if (drive.DriveType == System.IO.DriveType.Network)
                return PathKind.MappedNetworkDrive;
        }

        return PathKind.Local;
    }
}