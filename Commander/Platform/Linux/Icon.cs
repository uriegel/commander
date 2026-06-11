#if Linux
using System.Diagnostics;
using CsTools.Extensions;
using Gtk4DotNet;

static class Icon
{
    public static async Task<byte[]> GetFromExtensionAsync(string name, int size = 16)
    {
        if (name == ".jpeg" || name == ".jpg" || name == ".png")
            name = "jpg";
        else if (name == ".mp4" || name == ".mkv")
            name = "mp4";
        if (name == "jpg" || name == "mp4")
        {
            var resicon = Resources.Get(name);
            if (resicon != null)
            {
                using var ms = new MemoryStream();
                await (resicon?.CopyToAsync(ms) ?? Task.CompletedTask);
                return ms.ToArray();
            }
        }
        using var icon = GIcon.Get(Gio.GuessContentType(name) ?? "none");
        var names = icon.ThemedNames().ToArray();
        return await GetFromNameAsync(names[0], size);
    }

    public static async Task<byte[]> GetFromNameAsync(string name, int size = 16)
    {

        if (name == "starred" || name == "go-up")
        {
            var icon = Resources.Get(name);
            if (icon != null)
            {
                using var ms = new MemoryStream();
                await (icon?.CopyToAsync(ms) ?? Task.CompletedTask);
                return ms.ToArray();
            }
        }
        using var paintable = Display.GetDefault().GetIconTheme().LookupIcon(name, size);
        using var gfile = paintable.GetFile();
        var path = gfile.Path;
        if (path == null)
            return [];
        using var file = File.OpenRead(path);
        var payload = new byte[file.Length];
        int v = await file.ReadAsync(payload, 0, payload.Length);
        return payload;
    }
   
}

#endif