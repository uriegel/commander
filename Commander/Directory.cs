using AspNetExtensions;
using CsTools.Extensions;
using LinqTools;
using Microsoft.AspNetCore.Http;

record DirectoryItem(
    string Name,
    long Size,
    bool IsDirectory,
    string? IconPath,
    bool IsHidden,
    DateTime Time
);

record GetFiles(
    string Path,
    bool ShowHiddenItems
);

record GetFilesResult(
    DirectoryItem[] Items,
    string Path,
    int DirCount,
    int FileCount
);

record FileRequest(string Path);

static partial class Directory
{
    public static Task<GetFilesResult> GetFiles(GetFiles getFiles)
    {
        var dirInfo = new DirectoryInfo(getFiles.Path);
        var dirs = 
            dirInfo
                .GetDirectories()
                .Select(CreateDirItem)
                .Where(FilterHidden)
                .ToArray();                
        
        var files = 
            dirInfo
                .GetFiles()
                .Select(CreateFileItem)
                .Where(FilterHidden)
                .ToArray();                

        return new GetFilesResult(dirs.Concat(files).ToArray(),
            dirInfo.FullName,
            dirs.Length,
            files.Length)
                .ToAsync();

        DirectoryItem CreateDirItem(DirectoryInfo info)
            => new(
                info.Name,
                0,
                true,
                null,
                (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden,
                info.LastWriteTime);

        DirectoryItem CreateFileItem(FileInfo info)
            => new(
                info.Name,
                info.Length,
                false,
                GetIconPath(info),
                (info.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden,
                info.LastWriteTime);

        bool FilterHidden(DirectoryItem item)
            => getFiles.ShowHiddenItems || !item.IsHidden;
    }

    public static async Task ProcessFile(HttpContext context, string path)
    {
        using var stream = path.OpenFile();
        await context.SendStream(stream, null, path);
    }

    public static async Task ProcessMovie(HttpContext context, string path)
        => context.StreamRangeFile(path);
}

