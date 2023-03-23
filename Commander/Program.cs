using CsTools.Extensions;
using LinqTools;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;
using WebWindowNetCore;


var directories = ImageMetadataReader.ReadMetadata("/media/uwe/Home/Bilder/Fotos/2022/Uwes Handy/IMG_20210909_161122.jpg");
foreach (var directory in directories)
    foreach (var tag in directory.Tags)
        Console.WriteLine($"{directory.Name} - {tag.Name} = {tag.Description}");

var subIfdDirectory = directories.OfType<ExifSubIfdDirectory>().FirstOrDefault();
var dateTime = subIfdDirectory?.GetDescription(ExifDirectoryBase.TagDateTimeOriginal).ToDateTime("yyyy:MM:dd HH:mm:ss");


WebView
    .Create()
    .InitialBounds(600, 800)
    .Title("Commander")
    .ResourceIcon("icon")
    .SaveBounds()
    .DebugUrl($"http://localhost:3000")
    .QueryString(Platform.QueryString)
    .ConfigureHttp(http => http
        .ResourceWebroot("webroot", "/static")        
        .UseSse("commander/sse", Events.Source)
        .SideEffect(_ => Events.StartEvents())
#if DEBUG        
        .CorsOrigin("http://localhost:3000")
#endif        
        .MapGet("commander/getIcon", context =>  Directory.ProcessIcon(context, context.Request.Query["path"].ToString()))
        .MapGet("commander/image", context =>  Directory.ProcessFile(context, context.Request.Query["path"].ToString()))
        .MapGet("commander/file", context =>  Directory.ProcessFile(context, context.Request.Query["path"].ToString()))
        .MapGet("commander/movie", context =>  Directory.ProcessMovie(context, context.Request.Query["path"].ToString()))
        .JsonPost<GetFiles, GetFilesResult>("commander/getfiles", Directory.GetFiles)
        .JsonPost<Empty, RootItem[]>("commander/getroot", Root.Get)
        .Build())
#if DEBUG            
    .DebuggingEnabled()
#endif       
    .Build()
    .Run("de.uriegel.Commander");

record Empty();

// TODO ExtendedInfos
// TODO Rename
// TODO CreateFolder
// TODO Delete items
// TODO Windows exe file Icon
