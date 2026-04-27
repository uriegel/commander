#if Linux

using CsTools.Extensions;
using CsTools.Functional;
using GtkDotNet;

static partial class Directory
{
    public static string? GetIconPath(string name, string? path)
        => name.GetFileExtension();

    public static string GetFilePath(this string path) => $"/{path}";

    public static void CreateFolder(string name, string path)
        => System.IO.Directory.CreateDirectory(path.AppendPath(name));

    public static async Task DeleteItems(string[] items, string path)
    {
        await foreach (var item in items.ToAsyncEnumerable())
        {
            await GFile
                .New(path.AppendPath(item))
                .UseAsync(f => f.TrashAsync());
        }
    }

    public static CopyItem[] FlattenItems(FlattenItemsInput input)
    {
        return [];

    // public static AsyncResult<CopyItemInfo[], RequestError> CopyItemsInfo(CopyItemsParam input)
    // {
    //     return Try(
    //         () => input.Items.FlattenTree(Resolver, CreateCopyItemInfo, IsDirectory, new CancellationTokenSource(TimeSpan.FromSeconds(10)).Token,
    //                         AppendSubPath, (string?)null).ToArray(),
    //         MapException)
    //             .ToAsyncResult();

    //     (IEnumerable<CopyItem>, string?) Resolver(CopyItem item, string? subPath)
    //         => (GetCopyItems(subPath.AppendPath(item.Name)), item.Name);

    //     IEnumerable<CopyItem> GetCopyItems(string subPath)
    //     {
    //         var info = new DirectoryInfo(input.Path.AppendPath(subPath));
    //         var dirInfos = info
    //                         .GetDirectories()
    //                         .Select(n => new CopyItem(n.Name, true, 0, DateTime.MinValue, null));
    //         var fileInfos = info
    //                             .GetFiles()
    //                             .Select(n => new CopyItem(n.Name, false, n.Length, n.LastWriteTime, null));
    //         return fileInfos.Concat(dirInfos);
    //     }

    //     CopyItemInfo CreateCopyItemInfo(CopyItem copyItem, string? subPath) 
    //     {
    //         var targetFile = input.TargetPath.AppendPath(subPath).AppendPath(copyItem.Name);
    //         var fi = new FileInfo(targetFile);
    //         return new CopyItemInfo(
    //             copyItem.Name, 
    //             subPath ?? "", 
    //             copyItem.Size, 
    //             copyItem.Time, 
    //             fi.Exists ? fi.Length : null, 
    //             fi.Exists ? fi.LastWriteTime : null);
    //     }

    //     string AppendSubPath(string? initialPath, string? subPath)
    //         => initialPath.AppendPath(subPath);

    //     bool IsDirectory(CopyItem item, string? subPath)
    //         => item.IsDirectory == true;
    // }

    }

}   

#endif