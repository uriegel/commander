#if Linux
using Gtk4DotNet;

public class ProgressControl : Revealer
{
    public ProgressControl(Builder builder, string name) : base(builder, name)
    {
        // var builder = Builder.FromDotNetResource("progress-control");
        // menuButton = builder.GetWidget<MenuButtonHandle>("progress-control");
        // Handle.Child(menuButton);

        DataContext = ProgressContext.Instance;

        // Handle
        
        this.Binding("reveal-child", nameof(ProgressContext.CopyProgress), BindingFlags.Default, p => p != null);
        // builder.GetWidget<LabelHandle>("title-label")
        //     .Binding("label", nameof(ProgressContext.CopyProgress), BindingFlags.Default, cpc => ((CopyProgress?)cpc)?.Title);
        // builder.GetWidget<LabelHandle>("size-label")
        //     .Binding("label", nameof(ProgressContext.CopyProgress), BindingFlags.Default, cpc => $"({((CopyProgress?)cpc)?.TotalMaxBytes.ByteCountToString(2)})");
        //     //.Binding("opacity", nameof(ProgressContext.DeleteAction), BindingFlags.Default, hide => (bool?)hide == true ? 0.0 : 1.0);
        // builder.GetWidget<LabelHandle>("current-name-label")
        //     .Binding("label", nameof(ProgressContext.CopyProgress), BindingFlags.Default, cpc => ((CopyProgress?)cpc)?.Name);
        // builder.GetWidget<ProgressBarHandle>("progressbar-total")
        //     .Binding("fraction", nameof(ProgressContext.CopyProgress), BindingFlags.Default, ProgressContext.GetTotalFraction);
        // builder.GetWidget<ProgressBarHandle>("progressbar-current")
        //     .Binding("fraction", nameof(ProgressContext.CopyProgress), BindingFlags.Default, ProgressContext.GetFraction);

        // builder.GetWidget<LabelHandle>("total-count-label")
        //     .Binding("label", nameof(ProgressContext.CopyProgress), BindingFlags.Default, cpc => $"{((CopyProgress?)cpc)?.TotalCount}");
        // builder.GetWidget<LabelHandle>("current-count-label")
        //     .Binding("label", nameof(ProgressContext.CopyProgress), BindingFlags.Default, cpc => $"{((CopyProgress?)cpc)?.CurrentCount}");
        // builder.GetWidget<LabelHandle>("duration-label")
        //     .Binding("label", nameof(ProgressContext.CopyProgress), BindingFlags.Default, cpc => $"{((CopyProgress?)cpc)?.Duration:hh\\:mm\\:ss}");
        // builder.GetWidget<LabelHandle>("estimated-duration-label")
        //     .Binding("label", nameof(ProgressContext.CopyProgress), BindingFlags.Default, cpc => $"{ProgressContext.GetEstimatedDuration(cpc):hh\\:mm\\:ss}");
        // builder.GetWidget<ButtonHandle>("cancel-btn")
        //     .OnClicked(BackgroundJobs.Cancel);
    }

    public void ShowPopover()
    {
        // if (ProgressContext.Instance.CopyProgress != null)
        //     menuButton.Popup();
    }

}

 //   MenuButtonHandle menuButton = new(0);



#endif