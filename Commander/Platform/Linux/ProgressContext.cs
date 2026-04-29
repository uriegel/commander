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

    public static object GetFraction(object? copyProgress)
    {
        var cp = copyProgress as CopyProgress;
        return cp != null
            ? cp.CurrentMaxBytes != 0
            ? (double)cp.CurrentBytes / cp.CurrentMaxBytes
            : 0
            : 0;
    }

    public static object GetTotalFraction(object? progress)
    {
        var cp = progress as CopyProgress;
        return cp != null
            ? ((double)cp.TotalBytes + (double)cp.CurrentBytes) / (double)cp.TotalMaxBytes
            : 0;
    }
    
    public event PropertyChangedEventHandler? PropertyChanged;

    void OnChanged(string name) => PropertyChanged?.Invoke(this, new(name));
}

record CopyProgress(
    string Title,
    string Name,
    // int TotalCount,
    // int CurrentCount,
    long TotalMaxBytes,
    long TotalBytes,
    // long PreviousTotalBytes,
    long CurrentMaxBytes,
    long CurrentBytes,
    bool IsRunning
    // TimeSpan Duration
);