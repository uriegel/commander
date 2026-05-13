#if Windows
using System.Diagnostics;
using System.Runtime.InteropServices;
using ClrWinApi;
using CsTools.Extensions;
using static ClrWinApi.Api;

partial class Directory
{
    public static string? GetIconPath(string name, string? path)
        => name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) && path != null
            ? path.AppendPath(name)
            : name.GetFileExtension();

    public static string GetFilePath(string path) => path.Replace('/', '\\');

    public static Task CreateFolder(string name, string path)
        => Form.InvokeOnMainThread(() => 
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
        });

    public static Task DeleteItems(string[] items, string path) 
        => Form.InvokeOnMainThread(() => {
            var _ = SHFileOperation(new ShFileOPStruct
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
        });

    public static Task CopyAsync(JobBase input, Action<long, long> onProgress, CancellationToken? cancellation = null) => throw new NotImplementedException();

    public static Task CopyAsync(CopyInput input)
        => Form.InvokeOnMainThread(() => {
            var _ = SHFileOperation(new ShFileOPStruct
                {
                    Func = input.Move ? FileFuncFlags.MOVE : FileFuncFlags.COPY,
                    From = string.Join( "\U00000000", input.Items.Select(n => input.SourcePath.AppendPath(n.Name))) + "\U00000000\U00000000",
                    To = string.Join( "\U00000000", input.Items.Select(n => input.TargetPath.AppendPath(n.Name))) + "\U00000000\U00000000",
                    Flags = FileOpFlags.NOCONFIRMATION | FileOpFlags.NOCONFIRMMKDIR | FileOpFlags.MULTIDESTFILES,
                }) switch
                {
                    0    => 1,
                    2    => throw new FileNotFoundException(),
                    0x78 => throw new UnauthorizedAccessException() ,
                _    => throw new Exception($"Unknown error code: {Marshal.GetLastWin32Error()}")
                };   
        });

    public static async Task OnEnter(OnEnterInput input)
    {
        if (input.ShowProperties == true|| input.OpenWith == true) 
        {
            var info = new ShellExecuteInfo();
            info.Size = Marshal.SizeOf(info);
            info.Verb = input.ShowProperties == true ? "properties" : "openas";
            info.File = input.Path.AppendPath(input.Name);
            info.Show = ShowWindowFlag.Show;
            info.Mask = ShellExecuteFlag.InvokeIDList;
            ShellExecuteEx(ref info);     
        }
        else 
        {
            using var proc = new Process()
            {
                StartInfo = new ProcessStartInfo(input.Path.AppendPath(input.Name))
                {
                    UseShellExecute = true,
                },
            };
                
            proc.Start();        
        }        
    }           

    public static void AddNetworkShare(AddNetworkShareInput input)
    {
        var res = WNetAddConnection2(new()
            {
                Scope = ResourceScope.GlobalNetwork,
                ResourceType = ResourceType.Disk,
                DisplayType = ResourceDisplaytype.Share,
                RemoteName = input.Share,
            }, input.Passwd, input.Name, 0);
        switch (res)        
        {
            case 0:
                break;
            case 67:
                throw new NetworknameNotFoundException();
            case 5:
            case 86:                
                throw new WrongCredentialsException();
            default:
                throw new Exception($"Unknown error code: {Marshal.GetLastWin32Error()}");
        }
    }

    public static Task OpenFile(string _, string __) => throw new NotImplementedException();

    public static Task Rename(RenameInput input)   
        => Form.InvokeOnMainThread(() => {
            var _ = SHFileOperation(new ShFileOPStruct
                {
                    Func = FileFuncFlags.RENAME,
                    From = input.Path.AppendPath(input.Item) + "\U00000000\U00000000",
                    To = input.Path.AppendPath(input.NewName) + "\U00000000\U00000000",
                    Flags = FileOpFlags.NOCONFIRMATION | FileOpFlags.ALLOWUNDO
                }) switch
                {
                    0    => 1,
                    2    => throw new FileNotFoundException(),
                    0x78 => throw new UnauthorizedAccessException() ,
                _    => throw new Exception($"Unknown error code: {Marshal.GetLastWin32Error()}")
                };   
        });

    public static AppInfo[] GetRecommendedApps(string? file) => throw new NotImplementedException();
    public static AppInfo[] GetAllApps() => throw new NotImplementedException();

    public static void CheckGetFilesAccessException(string path)
    {
        var kind = path.GetPathKind();
        if (kind == PathKind.Unc || kind == PathKind.MappedNetworkDrive)
            throw new NotMountedException();
    }
    
    static bool FilterExifItems(DirectoryItem item)
    => item.Name.EndsWith("jpg", StringComparison.OrdinalIgnoreCase)
        || item.Name.EndsWith("jpeg", StringComparison.OrdinalIgnoreCase)
        || item.Name.EndsWith("jpg", StringComparison.OrdinalIgnoreCase)
        || item.Name.EndsWith("png", StringComparison.OrdinalIgnoreCase)
        || item.Name.EndsWith("exe", StringComparison.OrdinalIgnoreCase)
        || item.Name.EndsWith("dll", StringComparison.OrdinalIgnoreCase);
}

#endif