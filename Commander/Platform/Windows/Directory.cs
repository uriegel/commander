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
    {
        try 
        {
            System.IO.Directory.CreateDirectory(path.AppendPath(name));
        }
        catch (UnauthorizedAccessException)
        {
            var temp = Path.GetTempFileName();
            File.Delete(temp);
            System.IO.Directory.CreateDirectory(temp);
            var sourcePath = temp.AppendPath(name);
            System.IO.Directory.CreateDirectory(sourcePath);
            var res = SHFileOperation(new ShFileOPStruct
            {
                Func = FileFuncFlags.MOVE,
                From = $"{sourcePath}\U00000000\U00000000",
                To = $"{path}\U00000000\U00000000",
            });
            System.IO.Directory.Delete(temp, true);
            switch (res)
            {
                case 0:
                    break;
                case 2:
                    throw new FileNotFoundException();
                case 0x78:
                    throw new UnauthorizedAccessException();
                default:
                    throw new Exception($"Unknown error code: {Marshal.GetLastWin32Error()}");
            }
        }   
    }

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