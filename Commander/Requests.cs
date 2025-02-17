using CsTools.Extensions;
using WebServerLight;

static class Requests
{
    public static async Task<bool> JsonPost(IRequest request)
    {
        try
        {
            switch (request.Url)
            {
                case "/json/getroot":
                    await request.SendJsonAsync(await Root.Get().ToResult());
                    break;
                case "/json/getfiles":
                    await request.SendJsonAsync(await Directory.GetFiles((await request.DeserializeAsync<GetFiles>())!).ToResult());
                    break;
                case "/json/getextendeditems":
                    await request.SendJsonAsync(await Directory.GetExtendedItems((await request.DeserializeAsync<GetExtendedItems>())!));
                    break;
                case "/json/cancelextendeditems":
                    await request.SendJsonAsync(Directory.CancelExtendedItems((await request.DeserializeAsync<CancelExtendedItems>())!));
                    break;
                case "/json/createfolder":
                    await request.SendJsonAsync(Directory.CreateFolder((await request.DeserializeAsync<CreateFolderInput>())!));
                    break;
                case "/json/gettrackinfo":
                    await request.SendJsonAsync(await TrackInfo.Get((await request.DeserializeAsync<GetTrackInfo>())!.Path));
                    break;
                case "/json/showdevtools":
                    Globals.WebView?.ShowDevTools();
                    await request.SendJsonAsync("{}");
                    break;
                default:
                    return false;
            }
            return true;
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error occured in Requests.Process: {e}");
            return false;
        }
    }

    public static Task<bool> OnGet(IRequest request) =>
        request.Url switch
        {
            var url when url.StartsWith("/geticon") => Directory.ProcessIcon(url[9..], request),
            var url when url.StartsWith("/getfile") => Directory.ProcessFile(request),
            _ => false.ToAsync()
        };
}

record Empty();