#if Windows
using System.Runtime.InteropServices;
using ClrWinApi;
using CsTools.Extensions;

using static ClrWinApi.Api;

static partial class Directory
{
    public static string? GetIconPath(string name, string? path)
        => name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) && path != null
            ? path.AppendPath(name)
            : name.GetFileExtension();

    public static string GetFilePath(this string path) => path.Replace('/', '\\');

    public static void CreateFolder(string name, string path)
        // TODO UAC
        => System.IO.Directory.CreateDirectory(path.AppendPath(name));

    public static async Task<int> DeleteItems(string[] items, string path) 
        => SHFileOperation(new ShFileOPStruct
            {
                Func = FileFuncFlags.DELETE,
                From = string.Join( "\U00000000", items.Select(path.AppendPath)) + "\U00000000\U00000000",
                Flags = FileOpFlags.NOCONFIRMATION | FileOpFlags.ALLOWUNDO
            }) switch
            {
                0    => 1,
                2    => throw new FileNotFoundException(),
                0x78 => throw new UnauthorizedAccessException() ,
            _    => throw new Exception($"Unknown error code: {Marshal.GetLastWin32Error()}")
            };   
}

#endif