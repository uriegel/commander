#if Linux
using System.ComponentModel;

class MainContext : INotifyPropertyChanged
{
    public static MainContext Instance = new();

    public string ErrorText
    {
        get => field ?? "";
        set
        {
            if (field != value)
            {
                field = value;
                OnChanged(nameof(ErrorText));
                if (value != null)
                {
                    cts?.Cancel();
                    cts = new CancellationTokenSource();
                    runningTask = RunError(cts.Token);
                }
            }
        }
    }

    async Task RunError(CancellationToken cancellation)
    {
        await Task.Delay(6000, cancellation);
        ErrorText = "";
    }

    CancellationTokenSource? cts;
    Task? runningTask;

    public event PropertyChangedEventHandler? PropertyChanged;

    void OnChanged(string name) => PropertyChanged?.Invoke(this, new(name));
}

#endif