using CsTools.Extensions;
using CsTools.HttpRequest;
using System.Net.Http.Json;

using static CsTools.HttpRequest.Core;
using static AspNetExtensions.Core;

static partial class Remote
{
    static Settings GetFiles(string ip, Func<HttpContent> getContent)
    => DefaultSettings with
        {
            Method = HttpMethod.Post,
            BaseUrl = $"http://{ip}:8080",
            Url = "getfiles",
            AddContent = getContent
        };

    public static Task<GetFilesResult> GetFiles(GetFiles getFiles)
        => Request.GetStringAsync(GetFiles(getFiles.Path.StringBetween('/', '/'),
            () => JsonContent.Create(new
                {
                    Path = getFiles.Path.SubstringAfter('/').SubstringAfter('/') + '/'
                }, null, JsonWebDefaults)));
}