#if Windows

using CsTools.Extensions;

static class Icon
{
    public static async Task<byte[]> GetAsync(string name)
    {
        if (name == "kirk")
        {
            var icon = Resources.Get(name);
            using var ms = new MemoryStream();
            await (icon?.CopyToAsync(ms) ?? Task.CompletedTask);
            return ms.ToArray();
        }
        return [];
    }

    public static void StopProcessing() { }

    public static bool IsSvg(this byte[] payload) => false;
}

#endif