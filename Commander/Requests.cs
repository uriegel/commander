using System.Threading.Tasks;
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
            }

        }
        catch (Exception e)
        {
            Console.WriteLine($"Error occured in Requests.Process: {e}");
        }
    }
}

