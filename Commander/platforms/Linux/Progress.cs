using GtkDotNet;
using GtkDotNet.SafeHandles;
using LinqTools;

static class Progress
{
    public static WidgetHandle New()
        => Revealer.New()
            .SideEffect(RevealControl)
            .TransitionType(RevealerTransition.SlideLeft)
            .Child(
                MenuButton.New()
                .Popover(
                    Popover.New()
                    .Child(
                        ProgressBar.New()
                        .Ref(progressBar)
                        .ShowText()
                        .Fraction(.04)
                    )
                )
                .Child(
                    DrawingArea.New()
                    .Ref(drawingArea)
                    .SetDrawFunction((area, cairo, w, h) => cairo
                        .AntiAlias(CairoAntialias.Best)
                        .LineJoin(LineJoin.Miter)
                        .LineCap(LineCap.Round)
                        .Translate(w / 2.0, h / 2.0)
                        .StrokePreserve()
                        .ArcNegative(0, 0, (w < h ? w : h) / 2.0, -Math.PI / 2.0, -Math.PI / 2.0 + progress * Math.PI * 2)
                        .LineTo(0, 0)
                        .SourceRgb(0.7, 0.7, 0.7)
                        .Fill()
                        .MoveTo(0, 0)
                        .Arc(0, 0, (w < h ? w : h) / 2.0, -Math.PI / 2.0, -Math.PI / 2.0 + progress * Math.PI * 2)
                        .SourceRgb(0.3, 0.3, 0.3)
                        .Fill()
                    )
                )
            );

    static void RevealControl(RevealerHandle revealer)            
        => Events.CopyProgresses.Subscribe(n => 
            {
                if (n.TotalFileBytes == 0)
                    revealer.RevealChild();
                else if (n.IsFinished)
                    revealer.RevealChild(false);
                else
                {
                    progress = (float)n.CurrentBytes / n.TotalBytes;
                    Gtk.Dispatch(() =>
                    {
                        drawingArea.Ref.QueueDraw();
                        progressBar.Ref.Fraction(progress);
                    });
                }
            });

    static float progress = 0.0f;

    static readonly ObjectRef<DrawingAreaHandle> drawingArea = new();
    static readonly ObjectRef<ProgressBarHandle> progressBar = new();
}