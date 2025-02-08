using System.Threading.Tasks;
using WebWindowNetCore;

static class Requests
{
    public static async void Process(Request request)
    {
        try
        {
            var affen = Root.Get();
            var affe = await affen.ToResult();
            request.Response(affe);
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error occured in Requests.Process: {e}");
        }
    }
}