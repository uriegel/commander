using CsTools.Extensions;
using WebServerLight;

static class Requests
{
    public static async Task<bool> JsonPost(JsonRequest request)
    {
        try
        {
            switch (request.Url)
            {
                case "/json/getroot":
                    await request.SendAsync(await Root.Get().ToResult());
                    break;
                case "/json/getfiles":
                    await request.SendAsync(await Directory.GetFiles((await request.DeserializeAsync<GetFiles>())!).ToResult());
                    break;
                case "/json/getextendeditems":
                    await request.SendAsync(await Directory.GetExtendedItems((await request.DeserializeAsync<GetExtendedItems>())!));
                    break;
                case "/json/cancelextendeditems":
                    await request.SendAsync(Directory.CancelExtendedItems((await request.DeserializeAsync<CancelExtendedItems>())!));
                    break;
                case "/json/showdevtools":
                    Globals.WebView?.ShowDevTools();
                    await request.SendAsync("{}");
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

    public static Task<bool> OnGet(GetRequest request) =>
        request.Url switch
        {
            var iconurl when iconurl.StartsWith("/geticon") => Directory.ProcessIcon(iconurl[9..], request),
            _ => false.ToAsync()
        };
}

record Empty();