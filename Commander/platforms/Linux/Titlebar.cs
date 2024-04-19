#if Linux

using System.Security.Cryptography;
using CsTools.Functional;
using CsTools.HttpRequest;
using GtkDotNet;
using GtkDotNet.SafeHandles;
using static CsTools.Core;

record SetPreviewParam(bool Set);

static class TitleBar
{
    public static WidgetHandle New(ObjectRef<WebViewHandle> webView)
        => HeaderBar.New()
            .PackEnd(ToggleButton
                        .New()
                        .Ref(togglePreview)
                        .IconName("gtk-print-preview")
                        .OnClicked(() => OnTogglePreview(webView.Ref)))
            .PackEnd(Progress.New());

    public static AsyncResult<Nothing, RequestError> SetPreview(SetPreviewParam param)
        => Ok<Nothing, RequestError>(0.ToNothing())
            .SideEffectWhenOk(_ => togglePreview.Ref.SetActive(param.Set))
            .ToAsyncResult();  

    static void OnTogglePreview(WebViewHandle webView)
    {
        Events.SendPreview(togglePreview.Ref.Active());
        webView.GrabFocus();
    }

    static readonly ObjectRef<ToggleButtonHandle> togglePreview = new();
}

#endif

