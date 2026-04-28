using System.ComponentModel;

class ProgressContext : INotifyPropertyChanged
{
    public static ProgressContext Instance = new();

    public CopyProgress? CopyProgress
    {
        get => field;
        set
        {
            if (field != value)
            {
                field = value;
                OnChanged(nameof(CopyProgress));
            }
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    void OnChanged(string name) => PropertyChanged?.Invoke(this, new(name));
}

record CopyProgress(
    // string Title,
    // string Name,
    // int TotalCount,
    // int CurrentCount,
    // long TotalMaxBytes,
    // long TotalBytes,
    // long PreviousTotalBytes,
    // long CurrentMaxBytes,
    // long CurrentBytes,
    // bool IsRunning,
    // TimeSpan Duration
);