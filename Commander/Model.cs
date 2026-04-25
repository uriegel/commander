record NullData();

record GetFilesInput(string FolderId, int RequestId, string Path, bool ShowHidden);
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
    int? Idx= null,
    long? Size = null,
    bool? IsParent = null,
    bool? IsDirectory = null,
    string? IconPath = null,
    DateTime? Time = null,
    bool? IsHidden = null,
    ExifData? ExifData = null
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

    public static DirectoryItem CreateFileItem(FileInfo info, int idx)
        => new(info.Name, idx + 1)
        {
            Size = info.Length,
            IconPath = Directory.GetIconPath(info.Name, info.DirectoryName),
            IsHidden = (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden || info.Name.StartsWith('.'),
            Time = info.LastWriteTime
        };
}

static class ErrorType
{
    public const string Unknown = "UNKNOWN";
    public const string AccessDenied = "ACCESS_DENIED";
    public const string PathNotFound = "PATH_NOT_FOUND";
    public const string TrashNotPossible = "TRASH_NOT_POSSIBLE";
    public const string Cancelled = "CANCELLED";
    public const string FileExists = "FILE_EXISTS";
    public const string WrongCredentials = "WRONG_CREDENTIALS";
    public const string NetworkNameNotFound = "NETWORK_NAME_NOT_FOUND";
    public const string NetworkPathNotFound = "NETWORK_PATH_NOT_FOUND";
}

record SystemError(string Error, string Message);

class EventCmd
{
    public const string ExtendedInfos = "ExtendedInfos";
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

record EventData(string? AccentColor = null, bool? Maximized = null, bool? ShowHidden = null, int? RequestId = null, ExifData[]? Exifs = null);

record CommanderEvent(string? FolderId, string Cmd, EventData Msg);

record ExifData(int Idx, DateTime? DateTime, double? Latitude, double? Longitude);

