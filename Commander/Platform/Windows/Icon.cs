#if Windows

using CsTools.Extensions;

static class Icon
{
    public static async Task<byte[]> GetAsync(string name)
    {
        var icon = Resources.Get(name);
        if (icon != null)
        {
            using var ms = new MemoryStream();
            await (icon?.CopyToAsync(ms) ?? Task.CompletedTask);
            return ms.ToArray();
        }
        else
            return [];
    }

    public static void StopProcessing() { }

    public static bool IsSvg(this byte[] payload) => false;
}

#endif