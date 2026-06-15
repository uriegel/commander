#if Linux
using System.Diagnostics;
using CsTools.Extensions;
using CsTools.Functional;
using Gtk4DotNet;

partial class Directory
{
    public static string? GetIconPath(string name, string? path)
        => name.GetFileExtension();

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

    public static Task CopyAsync(CopyInput input) => BackgroundJobs.AddJobAsync(input, JobType.Copy);

    public static async Task CopyAsync(JobBase input, Action<long, long> onProgress, CancellationToken? cancellation = null)
    {
        void OnProgress(long curr, long max) => onProgress(curr, max);

        await GFile
            .New(input.SourcePath.AppendPath(input.Item.Name))
            .UseAsync(f => f.If(input.Move,
                f => f.MoveAsync(input.TargetPath.AppendPath(input.Item.Name), FileCopyFlags.Overwrite, true, OnProgress),
                f => f.CopyAsync(input.TargetPath.AppendPath(input.Item.Name), FileCopyFlags.Overwrite, true, OnProgress)));
    }

    public static Task OnEnter(OnEnterInput input)
    {
        if (input.OpenWith == true)
            AdwDialog.PresentFromTemplate("appchooser", "dialog", WebView.Window.Window, (builder, name) 
                => new AppChooser(builder, name, input.Path, input.Name));
        else
            OpenFile("xdg-open", input.Path.AppendPath(input.Name));
        return Task.CompletedTask;
    }

    public static string GetFilePath(string path) => $"/{path}";

    public static void OpenFile(string executable, string fileName)
        => new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = executable,
                Arguments = $"\"{fileName}\"",
                CreateNoWindow = true
            }
        }.Start();

    public static Task Rename(RenameInput input)
    {
        if (input.AsCopy == true)
            File.Copy(input.Path.AppendPath(input.Item), input.Path.AppendPath(input.NewName));
        else
            System.IO.Directory.Move(input.Path.AppendPath(input.Item), input.Path.AppendPath(input.NewName));
        return Task.CompletedTask;
    }

    public static void CheckGetFilesAccessException(string path) { }

    public static void AddNetworkShare(AddNetworkShareInput input) => throw new NotImplementedException();

    public static bool HasExtendedInfos(string name)
        => name.EndsWith("jpg", StringComparison.OrdinalIgnoreCase)
            || name.EndsWith("jpeg", StringComparison.OrdinalIgnoreCase)
            || name.EndsWith("jpg", StringComparison.OrdinalIgnoreCase)
            || name.EndsWith("png", StringComparison.OrdinalIgnoreCase);
}

#endif