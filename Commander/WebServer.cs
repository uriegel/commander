using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using GtkDotNet;
using UwebServer;
using UwebServer.Routes;

class WebServer
{
    public void Start() => server.Start();
    public void Stop() => server.Stop();

    public WebServer(ProgressControl progressControl)
    {
        var startTime = DateTime.Now;
        this.progressControl = progressControl;
        this.copyProcessor = new(progressControl);

        var routeWebSite = FileServing.Create(startTime);
        var routeService = new JsonService("/commander", async input =>
        {
            switch (input.Path)
            {
                case "getitems":
                {
                    var getItems = input.RequestParam.Get<GetItems>();
                    var items = DirectoryProcessor.GetItems(getItems.Path, getItems.HiddenIncluded, getItems.Id);
                    return items;
                }
                case "getroot":
                {
                    var getItems = input.RequestParam.Get<GetItems>();
                    var items = await RootProcessor.GetItemsAsync();
                    return items;
                }
                case "getexifs":
                {
                    var getExifs = input.RequestParam.Get<GetExifs>();
                    return getExifs.ExifItems
                        .Select(n => DirectoryProcessor.GetExifData(getExifs.path, n))
                        .Where(n => n != null);
                }
                case "copy":
                {
                    var items = input.RequestParam.Get<Copy>();
                        copyProcessor.AddJobs(items.Items.Select(n => Path.Combine(items.SourcePath, n)), items.destinationPath);
                        break;
                }
                default:
                    break;
            }
            return new { };
        });
        var routeFile = new FileRequest();

        server = new(new()
        {
            Port = 9865,
            Routes = new Route[]
            {
                routeService,
                routeFile,
                routeWebSite
            }
        });
    }

    class FileRequest : Route
    {
        public FileRequest() : base()
        {
            Method = Method.GET;
            Path = "/commander";
        }
        public override async Task ProcessAsync(IRequest request, IRequestHeaders headers, Response response)
        {
            var query = new UrlComponents(headers.Url[11..]);
            switch (query.Path)
            {
                case "geticon":
                    {
                        var ext = query.Parameters["ext"];
                        await FileServing.ServeIconAsync(ext, response);
                        break;
                    }
                case "getfile":
                    {
                        var file = query.Parameters["file"];
                        await response.SendFileAsync(file);
                        break;
                    }
                default:
                    await response.SendNotFoundAsync();
                    break;
            }
        }
    }
    readonly Server server;
    readonly CopyProcessor copyProcessor;
    readonly ProgressControl progressControl;
}

record GetItems(string Id, int RequestId, string Path, bool HiddenIncluded);
record GetExifs(string Id, int RequestId, string path, ExifItem[] ExifItems);
record ExifItem(int Index, string Name);
record ExifReturnItem(int Index, DateTime ExifTime);
record Copy(string SourcePath, String destinationPath, string[] Items);
