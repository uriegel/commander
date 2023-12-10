using GtkDotNet;
using GtkDotNet.SafeHandles;

static class TitleBar
{
    public static WidgetHandle New()
        => HeaderBar.New()
            .PackEnd(
                ToggleButton.New()
                .Ref(progressStarter)
                .IconName("open-menu-symbolic")
            )
            .PackEnd(Progress.New(progressStarter));

    static readonly ObjectRef<ToggleButtonHandle> progressStarter = new();                        
}
