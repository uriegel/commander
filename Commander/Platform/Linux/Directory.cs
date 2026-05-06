#if Linux
using CsTools.Extensions;
using CsTools.Functional;
using GtkDotNet;
using GtkDotNet.SafeHandles;
using static CsTools.ProcessCmd;

static partial class Directory
{
    public static string? GetIconPath(string name, string? path)
        => name.GetFileExtension();

    public static string GetFilePath(this string path) => $"/{path}";

    public static Task CreateFolder(string name, string path)
        => System.IO.Directory.CreateDirectory(path.AppendPath(name)).ToAsync();

    public static async Task DeleteItems(string[] items, string path)
    {
        await foreach (var item in items.ToAsyncEnumerable())
        {
            await GFile
                .New(path.AppendPath(item))
                .UseAsync(f => f.TrashAsync());
        }
    }

    public static Task CopyAsync(CopyInput input) => BackgroundJobs.AddJobAsync(input);

    public static async Task CopyAsync(JobBase input, Action<long, long> onProgress, CancellationToken? cancellation = null)
    {
        void OnProgress(long curr, long max) => onProgress(curr, max);

        await GFile
            .New(input.SourcePath.AppendPath(input.Item.Name))
            .UseAsync(f => f.If(input.Move,
                f => f.MoveAsync(input.TargetPath.AppendPath(input.Item.Name), FileCopyFlags.Overwrite, true, OnProgress, cancellation),
                f => f.CopyAsync(input.TargetPath.AppendPath(input.Item.Name), FileCopyFlags.Overwrite, true, OnProgress, cancellation)));
    }

    public static Task OnEnter(OnEnterInput input)
        => RunAsync("xdg-open", $"\"{input.Path.AppendPath(input.Name)}\"");

    public static AppInfo[] GetRecommendedApps(string? file)
    {
        if (file == null)
            return [];
        using var fileHandle = GFile.New(file);
        if (fileHandle == null)
            return [];
        var contentType = GFile.QueryContentType(fileHandle)?.GetContentType();
        if (contentType == null)
            return [];
        using var appinfo = GtkDotNet.AppInfo.GetRecommendedApps(contentType);
        return appinfo.GetAppInfos();
    }

    public static AppInfo[] GetAllApps()
    {
        using var appinfo = GtkDotNet.AppInfo.GetAllApps();
        return appinfo.GetAppInfos();
    }

    public static Task OpenFile(string executable, string fileName)
        => RunAsync(executable, $"\"{fileName}\"");

    public static void Rename(RenameInput input)
    {
        if (input.AsCopy == true)
            File.Copy(input.Path.AppendPath(input.Item), input.Path.AppendPath(input.NewName));
        else
            System.IO.Directory.Move(input.Path.AppendPath(input.Item), input.Path.AppendPath(input.NewName));
    }
        
    static AppInfo[] GetAppInfos(this IEnumerable<AppInfoHandle> appinfo)
        => [.. appinfo.Select(n =>
        {
            var iconPath = n.GetIcon();
            return new AppInfo(n.GetName(), n.GetExecutable(), iconPath?.Name, iconPath?.IsPath == true);
        })
        .OrderBy(n => n.Name)];
}

#endif