using CsTools.Extensions;
static partial class Remote
{
    public static async Task<GetFilesResult> GetFiles(GetFiles getFiles)
    {
        var test = getFiles.Path;
        var ip = getFiles.Path.StringBetween('/', '/');
        var path = getFiles.Path.SubstringAfter('/').SubstringAfter('/') + '/';
        return new GetFilesResult(
            Array.Empty<DirectoryItem>(),
            getFiles.Path,
            0,
            0);
    }
}