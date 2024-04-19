#if Linux

using CsTools.Functional;
using CsTools.HttpRequest;
using GtkDotNet;
using GtkDotNet.SafeHandles;
using static CsTools.Core;

record SetPreviewParam(bool Set);

static class TitleBar
{
    public static WidgetHandle New()
        => HeaderBar.New()
            .PackEnd(Progress.New())
            .PackEnd(ToggleButton
                        .New()
                        .Ref(togglePreview)
                        .IconName("gtk-print-preview")
                        .OnClicked(OnTogglePreview));

    public static AsyncResult<Nothing, RequestError> SetPreview(SetPreviewParam param)
        => Ok<Nothing, RequestError>(0.ToNothing())
            .SideEffectWhenOk(_ => togglePreview.Ref.SetActive(param.Set))
            .ToAsyncResult();  

    static void OnTogglePreview()
        => Events.SendPreview(togglePreview.Ref.Active());

    static readonly ObjectRef<ToggleButtonHandle> togglePreview = new();
}

#endif

// TODO Menu not fully synchronized when toggled here
// TODO When toggled here set focus to commander