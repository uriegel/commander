#if Windows

static class Progress
{
    public static void Show()
        => Events.ShowProgressChanged();
}

#endif