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

    public static FlatCopyItem[] FlattenItems(FlattenItemsInput input)
    {
        return [
            .. input.Items.FlattenTree(Resolver, CreateCopyItemInfo, IsDirectory, new CancellationTokenSource(TimeSpan.FromSeconds(10)).Token, AppendSubPath, (string?)null)
        ];

        (IEnumerable<CopyItem>, string) Resolver(CopyItem item, string? subPath)
            => (GetCopyItems(subPath.AppendPath(item.Name)), item.Name);


        IEnumerable<CopyItem> GetCopyItems(string subPath)
        {
            var info = new DirectoryInfo(input.Path.AppendPath(subPath));
            var dirInfos = info
                            .GetDirectories()
                            .Select(n => new CopyItem(n.Name, true, null, null, 0, null, null));
            var fileInfos = info
                                .GetFiles()
                                .Select(n => new CopyItem(n.Name, false, null, n.LastWriteTime, n.Length, null, null));
            return fileInfos.Concat(dirInfos);
        }

        FlatCopyItem CreateCopyItemInfo(CopyItem copyItem, string? subPath)
        {
            var targetFile = input.TargetPath.AppendPath(subPath).AppendPath(copyItem.Name);
            var fi = new FileInfo(targetFile);
            return new FlatCopyItem(
                subPath.AppendPath(copyItem.Name),
                GetIconPath(copyItem.Name, null),
                copyItem.Time,
                copyItem.Size,
                fi.Exists ? fi.LastWriteTime : null,
                fi.Exists ? fi.Length : null);
        }

        static bool IsDirectory(CopyItem item, string? subPath) => item.IsDirectory == true;

        static string AppendSubPath(string? initialPath, string? subPath) => initialPath.AppendPath(subPath);
    }

}   

record MetaCopyItem(
    string Name,
    bool IsDirectory,
    string? IconPath,
    DateTime? Time,
    long? Size,
    DateTime? TargetTime,
    long? TargetSize
);

#endif