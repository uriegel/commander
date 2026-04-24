record NullData();

record GetFilesInput(string FolderId, int RequestId, string Path, bool ShowHidden);
record CancelExifsInput(string RequestId);
record GetItemsFinishedInput(string FolderId);
record CmdInput(string Cmd);

record GetItemsOutput(string Path, int DirCount, int FileCount);
record GetRootItemsOutput(RootItem[] Items, string Path, int DirCount, int FileCount) : GetItemsOutput(Path, DirCount, FileCount) { }
record GetDirectoryItemsOutput(DirectoryItem[] Items, string Path, int DirCount, int FileCount) : GetItemsOutput(Path, DirCount, FileCount) {}
record GetAccentColorOutput(string Color);

record Item(
    string Name,
    int? Idx,
    long? Size,
    bool? IsParent,
    bool? IsDirectory);

static class DriveType
{
    public const string Home = "HOME";
    public const string Removable = "REMOVABLE";
    public const string Harddrive = "HARDDRIVE";
} 

record RootItem(
    string Name,
    string Description,
    long? Size,
    string MountPoint,
    bool IsMounted,
    //string DriveType,
    string Type = DriveType.Harddrive 
) : Item(Name, null, Size, false, true)
{ }

record DirectoryItem(
    string Name,
    int? Idx = null,
    long? Size = null,
    bool? IsParent = null,
    bool? IsDirectory = null,
    string? IconPath = null,
    DateTime? Time = null,
    bool? IsHidden = null
//    exifData?:      ExifData
//fileVersion?:   VersionInfo
) : Item(Name, Idx, Size, IsParent, IsDirectory)
{
    public static DirectoryItem CreateDirItem(DirectoryInfo info)
        => new(info.Name)
        {
            IsDirectory = true,
            IsHidden = (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden || info.Name.StartsWith('.'),
            Time = info.LastWriteTime
        };

    public static DirectoryItem CreateFileItem(FileInfo info)
        => new(info.Name)
        {
            Size = info.Length,
            IconPath = Directory.GetIconPath(info.Name, info.DirectoryName),
            IsHidden = (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden || info.Name.StartsWith('.'),
            Time = info.LastWriteTime
        };

}

class EventCmd
{
    public const string Exif = "Exif";
    public const string ExifStart = "ExifStart";
    public const string ExifStop = "ExifStop";
    public const string CopyProgress = "CopyProgress";
    public const string CopyStop = "CopyStop";
    public const string CopyProgressShowDialog = "CopyProgressShowDialog";
    public const string VersionsStart = "VersionsStart";
    public const string VersionsStop = "VersionsStop";
    public const string Versions = "Versions";
    public const string ThemeChanged = "ThemeChanged";
    public const string DeleteProgress = "DeleteProgress";
    public const string DeleteStop = "DeleteStop";
    public const string WindowState = "WindowState";
    public const string ShowHidden = "ShowHidden";
}
