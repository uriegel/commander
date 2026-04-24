record Item(
    string Name,
    int? Idx,
    long? Size,
    bool? IsParent,
    bool? IsDirectory);

record DirectoryItem(
    string Name,
    int? Idx = null,
    long? Size = null,
    bool? IsParent = null,
    bool? IsDirectory = null,
    string? IconPath = null,
    DateTime? Time = null,
    bool? IsHidden  = null
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

