#if Windows
using System.Diagnostics;
using CsTools.Extensions;

static class FileVersion
{
    public static VersionInfo[] GetVersionItems(string path, IEnumerable<DirectoryItem> items, CancellationToken cancellation)
    {
        var checkItems = items
                            .SelectFilterNull(n => n.Idx.HasValue ? n : null)
                            .Where(FilterVersionItems);
        if (!checkItems.Any())
            return [];

        return [.. checkItems
                .Where(_ => !cancellation.IsCancellationRequested)
                .SelectFilterNull(n =>
                {
                    var info = FileVersionInfo.GetVersionInfo(path.AppendPath(n.Name));
                    return n.Idx.HasValue && info != null 
                        ? MapVersion(n.Idx.Value, info) 
                        : null;
                })];
    }

    static bool FilterVersionItems(DirectoryItem item)
        => item.Name.EndsWith("exe", StringComparison.OrdinalIgnoreCase)
            || item.Name.EndsWith("dll", StringComparison.OrdinalIgnoreCase);

    static VersionInfo? MapVersion(int idx, FileVersionInfo? info)
        => info != null
            ? new(idx, new(info.FileMajorPart, info.FileMinorPart, info.FileBuildPart, info.FilePrivatePart))
            : null;
}
#endif