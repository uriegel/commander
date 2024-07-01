#if Linux
using CsTools.Extensions;
using GtkDotNet;
using GtkDotNet.SafeHandles;

static class DeleteProgress
{
    public static WidgetHandle New()
        => Revealer.New()
            .Ref(revealer)
            .SideEffect(RevealControl)
            .TransitionType(RevealerTransition.SlideLeft)
            .Child(
                MenuButton.New()
                .Popover(
                    Popover.New()
                    .Ref(pop)
                    .Child(
                        Box.New(Orientation.Vertical, 20)
                        .SizeRequest(400, -1)
                        .Append(
                            Label.New("Fortschritt beim Löschen")
                            .Ref(DeleteProgressTitle)
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
                            .OnClicked(() =>
                            {
                                RemoteDeleteProcessor.Cancel();
                                revealer.Ref.RevealChild(false);
                            })
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
                        .ArcNegative(0, 0, (w < h ? w : h) / 2.0, -Math.PI / 2.0, -Math.PI / 2.0 + Math.Max(progress, 0.01) * Math.PI * 2)
                        .LineTo(0, 0)
                        .SourceRgb(0.7, 0.7, 0.7)
                        .Fill()
                        .MoveTo(0, 0)
                        .Arc(0, 0, (w < h ? w : h) / 2.0, -Math.PI / 2.0, -Math.PI / 2.0 + Math.Max(progress, 0.01) * Math.PI * 2)
                        .SourceRgb(rgbActive.Red, rgbActive.Green, rgbActive.Blue)
                        .Fill()
                    )
                )
            );

    public static void Show() => pop.Ref.Show();

    public static bool WantClose()
        => IsProcessing()
            .SideEffectIf(b => b,
                _ => DeleteProgress.Show()) 
                == false;

    // TODO Windows version
    static void RevealControl(RevealerHandle revealer)
        => Events.RemoteDeleteProgresses.Subscribe(n =>
            {
                if (n.IsStarted)
                {
                    rgbActive = rgbFill;
                    revealer.RevealChild();
                }
                else if (n.IsFinished)
                {
                    rgbActive = rgbFillFinished;
                    Gtk.Dispatch(() => drawingArea.Ref.QueueDraw());
                }
                else if (n.IsDisposed)
                    revealer.RevealChild(false);
                else
                {
                    progress = (float)n.CurrentCount / n.TotalCount;
                    Gtk.Dispatch(() =>
                    {
                        drawingArea.Ref.QueueDraw();
                        totalProgressBar.Ref.Fraction(progress);
                        DeleteProgressTitle.Ref.Set($"Fortschritt beim Löschen ({n.CurrentCount})");
                        CurrentName.Ref.Set(n.FileName + " ");
                        FileCount.Ref.Set($"{n.CurrentCount}/{n.TotalCount}");
                        if (lastDeleteTime != n.DeleteTime)
                        {
                            lastDeleteTime = n.DeleteTime;
                            Duration.Ref.Set(n.DeleteTime.FormatSeconds());
                            if (n.CurrentCount > 0)
                                TotalDuration.Ref.Set($"{((int)(n.DeleteTime * n.TotalCount / n.CurrentCount)).FormatSeconds()}");
                        }
                    });
                }
            });

    static readonly ObjectRef<RevealerHandle> revealer = new();
    static readonly ObjectRef<PopoverHandle> pop = new();
    static readonly ObjectRef<DrawingAreaHandle> drawingArea = new();
    static readonly ObjectRef<ProgressBarHandle> progressBar = new();
    static readonly ObjectRef<ProgressBarHandle> totalProgressBar = new();
    static readonly ObjectRef<LabelHandle> DeleteProgressTitle = new();
    static readonly ObjectRef<LabelHandle> CurrentName = new();
    static readonly ObjectRef<LabelHandle> FileCount = new();
    static readonly ObjectRef<LabelHandle> Duration = new();
    static readonly ObjectRef<LabelHandle> TotalDuration = new();
    static readonly RGB rgbFill = new(0, 0, 255);
    static readonly RGB rgbFillFinished = new(0.7f, 0.7f, 0.7f);

    static RGB rgbActive = rgbFill;
    static float progress = 0.0f;
    static int lastDeleteTime;
}    

#endif