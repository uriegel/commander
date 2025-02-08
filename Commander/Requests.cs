using System.Threading.Tasks;
using WebWindowNetCore;

static class Requests
{
    public static async void Process(Request request)
    {
        try
        {
            request.Response(await Root.Get().ToResult());
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error occured in Requests.Process: {e}");
        }
    }
}