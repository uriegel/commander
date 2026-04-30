#if Linux
using CsTools.Extensions;
using CsTools.Functional;
using GtkDotNet;

using static CsTools.ProcessCmd;

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

    public static async Task CopyAsync(JobBase input, Action<long, long> onProgress, CancellationToken? cancellation = null)
    {
        void OnProgress(long curr, long max) => onProgress(curr, max);

        await GFile
            .New(input.SourcePath.AppendPath(input.Item.Name))
            .UseAsync(f => f.If(input.Move,
                f => f.MoveAsync(input.TargetPath.AppendPath(input.Item.Name), FileCopyFlags.Overwrite, true, OnProgress, cancellation),
                f => f.CopyAsync(input.TargetPath.AppendPath(input.Item.Name), FileCopyFlags.Overwrite, true, OnProgress, cancellation)));
    }

    public static async Task OnEnter(OnEnterInput input)
    {
        await RunAsync("xdg-open", $"\"{input.Path.AppendPath(input.Name)}\"");
    }
}   

#endif