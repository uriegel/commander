
using WebServerLight;

static class Requests
{
    public static async Task<bool> GetDrives(IRequest request)
    {
        var _ = await request.DeserializeAsync<NullData>();
        var drives = await Drive.Get();
        var response = new DriveItemResponse(drives, "root", drives.Length);
        await request.SendJsonAsync(response);
        return true;
    }

    public static async Task<bool> CancelExifs(IRequest request)
    {
        var data = await request.DeserializeAsync<CancelExifs>();
        await request.SendJsonAsync(new NullData());
        return true;
    }

    public static async Task<bool> GetItemsFinished(IRequest request)
    {
        var data = await request.DeserializeAsync<GetItemsFinished>();
        await request.SendJsonAsync(new NullData());
        return true;
    }
}

record FileItem();

record GetDrives(string FolderId, string RequestId, string Path, bool ShowHidden);
record CancelExifs(string RequestId);
record NullData();
record GetItemsFinished(string FolderId);