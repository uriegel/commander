#if Linux
using System.ComponentModel;

class MainContext : INotifyPropertyChanged
{
    public static MainContext Instance = new();

    public string ErrorText
    {
        set
        {
            BannerText = value;
            BannerWarning = true;
        }
    }

    public string BannerText
    {
        get => field ?? "";
        set
        {
            cts?.Cancel();
            cts = null;
            if (value != null)
            {
                BannerWarning = false;
                cts = new CancellationTokenSource();
                runningTask = RunError(cts.Token);  
            }
            field = value;
            OnChanged(nameof(BannerText));
        }
    }

    public bool BannerWarning
    {
        get;
        set
        {
            if (field != value)
            {
                field = value;
                OnChanged(nameof(BannerWarning));
            }
        }
    }

    async Task RunError(CancellationToken cancellation)
    {
        try
        {
            await Task.Delay(6000, cancellation);
            BannerText = null!;
            BannerWarning = false;
        }
        catch (OperationCanceledException) { }
    }

    CancellationTokenSource? cts;
    Task? runningTask;

    public event PropertyChangedEventHandler? PropertyChanged;

    void OnChanged(string name) => PropertyChanged?.Invoke(this, new(name));
}

#endif