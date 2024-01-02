#if Linux
using CsTools.Extensions;
using GtkDotNet;
using GtkDotNet.SafeHandles;

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
                        Box.New(Orientation.Vertical, 20)
                        .SizeRequest(400, -1)
                        .Append(
                            Label.New("Fortschritt beim Kopieren")
                            .Ref(CopyProgressTitle)
                            .HAlign(Align.Start)
                        )
                        .Append(
                            Grid.New()
                            .HAlign(Align.Fill)
                            .Attach(Label
                                .New("")
                                .Ref(CurrentName)
                                .HAlign(Align.Start), 0, 0, 1, 1)
                            .Attach(Label
                                .New("")
                                .Ref(FileCount)
                                .HAlign(Align.End)
                                .HExpand(true), 2, 0, 1, 1)
                            .Attach(Label
                                .New("Dauer: ")
                                .HAlign(Align.Start), 0, 1, 1, 1)
                            .Attach(Label
                                .New("")
                                .Ref(Duration)
                                .HAlign(Align.End), 2, 1, 1, 1)
                            .Attach(Label
                                .New("Geschätzte Dauer: ")
                                .HAlign(Align.Start), 0, 2, 1, 1)
                            .Attach(Label
                                .New("")
                                .Ref(TotalDuration)
                                .HAlign(Align.End), 2, 2, 1, 1)
                        )
                        .Append(
                            ProgressBar.New()
                            .Ref(progressBar)
                            .ShowText()
                            .Fraction(.0)
                        )
                        .Append(
                            Box.New(Orientation.Vertical)
                            .Append(Label.New("Gesamt:").HAlign(Align.Start))
                            .Append(
                                ProgressBar.New()
                                .Ref(totalProgressBar)
                                .ShowText()
                                .Fraction(.0)
                            )
                        )
                        .Append(
                            Button.NewWithLabel("Abbrechen")
                            .OnClicked(CopyProcessor.Cancel)
                        )
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
    // TODO while copying color selected then 5s color gray
        => Events.CopyProgresses.Subscribe(n =>
            {
                if (n.IsStarted)
                    revealer.RevealChild();
                else if (n.IsFinished)
                    revealer.RevealChild(false);
                else
                {
                    progress = (float)n.CurrentBytes / n.TotalBytes;
                    Gtk.Dispatch(() =>
                    {
                        drawingArea.Ref.QueueDraw();
                        if (n.TotalFileBytes > 0)
                            progressBar.Ref.Fraction((float)n.CurrentFileBytes / n.TotalFileBytes);
                        totalProgressBar.Ref.Fraction(progress);
                        CopyProgressTitle.Ref.Set($"Fortschritt beim Kopieren ({n.TotalBytes.ByteCountToString(2)})");
                        CurrentName.Ref.Set(n.FileName + " ");
                        FileCount.Ref.Set($"{n.CurrentCount}/{n.TotalCount}");
                        if (lastCopyTime != n.CopyTime)
                        {
                            lastCopyTime = n.CopyTime;
                            Duration.Ref.Set(n.CopyTime.FormatSeconds());
                            if (n.CurrentBytes > 0)
                                TotalDuration.Ref.Set($"{((int)(n.CopyTime * n.TotalBytes / n.CurrentBytes)).FormatSeconds()}");
                        }
                    });
                }
            });

    static float progress = 0.0f;
    static int lastCopyTime;

    static readonly ObjectRef<DrawingAreaHandle> drawingArea = new();
    static readonly ObjectRef<ProgressBarHandle> progressBar = new();
    static readonly ObjectRef<ProgressBarHandle> totalProgressBar = new();
    static readonly ObjectRef<LabelHandle> CopyProgressTitle = new();
    static readonly ObjectRef<LabelHandle> CurrentName = new();
    static readonly ObjectRef<LabelHandle> FileCount = new();
    static readonly ObjectRef<LabelHandle> Duration = new();
    static readonly ObjectRef<LabelHandle> TotalDuration = new();    
}    

#endif