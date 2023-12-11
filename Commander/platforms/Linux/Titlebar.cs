#if Linux
using GtkDotNet;
using GtkDotNet.SafeHandles;

static class TitleBar
{
    public static WidgetHandle New()
        => HeaderBar.New()
            .PackEnd(Progress.New());
}

#endif