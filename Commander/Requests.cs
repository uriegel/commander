using System.Threading.Tasks;
using CsTools.Extensions;
using WebWindowNetCore;

static class Requests
{
    public static async void Process(Request request)
    {
        try
        {
            switch (request.Cmd)
            {
                case "getroot":
                    request.Response(await Root.Get().ToResult());
                    break;
                case "getfiles":
                    request.Response(await Directory.GetFiles(request.Deserialize<GetFiles>()!).ToResult());
                    break;
                case "getextendeditems":
                    request.Response(await Directory.GetExtendedItems(request.Deserialize<GetExtendedItems>()!).ToResult());
                    break;
            }

        }
        catch (Exception e)
        {
            Console.WriteLine($"Error occured in Requests.Process: {e}");
        }
    }

    public static Task<Stream?> OnResource(string url) =>
        url switch
        {
            var iconurl when iconurl.StartsWith("geticon") => Directory.ProcessIcon(iconurl[8..]),
            _ => ((Stream?)null).ToAsync()
        };
}

