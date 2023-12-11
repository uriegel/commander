#if Linux
using System.Globalization;
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
                            .Fraction(.04)
                        )
                        .Append(
                            Box.New(Orientation.Vertical)
                            .Append(Label.New("Gesamt:").HAlign(Align.Start))
                            .Append(
                                ProgressBar.New()
                                .Ref(totalProgressBar)
                                .ShowText()
                                .Fraction(.04)
                            )
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
                        progressBar.Ref.Fraction((float)n.CurrentFileBytes / n.TotalFileBytes);
                        totalProgressBar.Ref.Fraction(progress);
                        CopyProgressTitle.Ref.Set($"Fortschritt beim Kopieren ({n.TotalBytes.ByteCountToString(2)})");
                        CurrentName.Ref.Set(n.FileName + " ");
                        FileCount.Ref.Set($"{n.CurrentCount}/{n.TotalCount}");
                        if (lastCopyTime != n.CopyTime)
                        {
                            lastCopyTime = n.CopyTime;
                            Duration.Ref.Set(n.CopyTime.FormatSeconds());
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

static class LongExtensions
{
    public static string ByteCountToString(this long byteCounts, int decimalPlaces)
    {
        var gb = Math.Floor((double)byteCounts / (1024 * 1024 * 1024));
        var mb = byteCounts % (1024 * 1024 * 1024);
        if (gb >= 1.0)
            return $"{gb}{CultureInfo.CurrentCulture.NumberFormat.NumberDecimalSeparator}{mb.ToString()[0..decimalPlaces]} GB";
        var mb2 = Math.Floor((double)byteCounts / (1024 * 1024));
        var kb = byteCounts % (1024 * 1024);
        if (mb2 >= 1.0)
            return $"{mb2}{CultureInfo.CurrentCulture.NumberFormat.NumberDecimalSeparator}{kb.ToString()[0..decimalPlaces]} MB";
        var kb2 = Math.Floor((double)byteCounts / 1024);
        var b = byteCounts % 1024;
        if (kb2 >= 1.0)
            return $"{kb2}{CultureInfo.CurrentCulture.NumberFormat.NumberDecimalSeparator}{b.ToString()[0..decimalPlaces]} KB";
        else
            return $"{b} B";
    }
}

static class IntExtensions
{
    public static string FormatSeconds(this int secsString)
    {
        // TODO hours
        var secs = secsString % 60;
        var min = Math.Floor((double)secsString / 60);
        return $"{min:00}:{secs:00}";
    }
}