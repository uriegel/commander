#if Linux

using GtkDotNet;
using CsTools;
using Microsoft.AspNetCore.Http;
using AspNetExtensions;

using static CsTools.Core;

static partial class Directory
{
    public static string GetIconPath(FileInfo info)
        => info.Extension?.Length > 0 ? info.Extension : ".noextension";

    public static Task ProcessIcon(HttpContext context, string iconHint)
        => RepeatOnException(() => 
            WebWindowNetCore.WebView.GtkApplication!.Dispatch(async () =>
                {
                    using var iconInfo = IconInfo.Choose(iconHint, 16, IconLookup.ForceSvg);
                    var iconFile = iconInfo.GetFileName();
                    using var stream = iconFile?.OpenFile();
                    await context.SendStream(stream!, null);
                }, 100), 
            1);
}

#endif