record NullData();

record GetFilesInput(string FolderId, int RequestId, string Path, bool ShowHidden);
record GetItemsFinishedInput(string FolderId);
record CmdInput(string Cmd);
record MountInput(string Device);
record CreateFolderInput(string Path, string Item);
record DeleteInput(string Path, string[] Items);
record FlattenItemsInput(string Path, string TargetPath, CopyItem[] Items);
record CopyInput(string SourcePath, string TargetPath, CopyFile[] Items, long TotalSize, bool Move);
record OnEnterInput(string Name, string Path, bool? OpenWith, bool? ShowProperties);
record GetItemsOutput(string Path, int DirCount, int FileCount);
record GetRecommendedAppsInput(string File);

record GetRootItemsOutput(RootItem[] Items, string Path, int DirCount, int FileCount) : GetItemsOutput(Path, DirCount, FileCount) { }
record GetDirectoryItemsOutput(DirectoryItem[] Items, string Path, int DirCount, int FileCount) : GetItemsOutput(Path, DirCount, FileCount) {}
record GetAccentColorOutput(string Color);
record MountOutput(string Path);

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
    bool? IsHidden = null,
    ExifData? ExifData = null,
    Version? FileVersion = null
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

record ExifData(int Idx, DateTime? DateTime, double? Latitude, double? Longitude);
record Version(int Major, int Minor, int Build, int Patch);

record GpxTrack(
    string? Name,
    string? Description,
    float Distance,
    int Duration,
    float AverageSpeed,
    int AverageHeartRate,
    GpxPoint[]? TrackPoints,
    string Date
);

record GpxPoint(
    double Latitude,
    double Longitude,
    double Elevation,
    string? Time,
    int Heartrate,
    float Velocity
);

record CopyItem(
    string Name,
    bool IsDirectory,
    string? IconPath,
    DateTime? Time,
    long? Size,
    DateTime? TargetTime,
    long? TargetSize
);

record CopyFile(string Name, long Size);

record FlatCopyItem(
    string Name,
    string? IconPath,
    DateTime? Time,
    long? Size,
    DateTime? TargetTime,
    long? TargetSize
);

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
    public const string ExtendedInfosStart = "ExtendedInfosStart";
    public const string ExtendedInfosStop = "ExtendedInfosStop";
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
    public const string ShowViewer = "ShowViewer";
    public const string PreviewMode = "PreviewMode";
    public const string Cmd = "Cmd";
}

class PreviewMode
{
    public const string IMAGE = "IMAGE";
    public const string LOCATION = "LOCATION";
    public const string IMAGE_LOCATION = "IMAGE_LOCATION";
}

record EventData(
    string? AccentColor = null,
    bool? Maximized = null,
    bool? ShowHidden = null,
    bool? ShowViewer = null,
    int? RequestId = null,
    ExifData[]? Exifs = null,
    VersionInfo[]? Versions = null,
    string? PreviewMode = null,
    string? Cmd = null);

record CommanderEvent(string? FolderId, string Cmd, EventData Msg);

record VersionInfo(int Idx, Version Version);
