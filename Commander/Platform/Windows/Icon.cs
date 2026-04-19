#if Windows

static class Icon
{
    public static async Task<byte[]> GetAsync(string name)
    {
        return [];
    }

    public static void StopProcessing() { }

    public static bool IsSvg(this byte[] payload) => false;
}

#endif