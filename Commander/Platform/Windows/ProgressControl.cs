#if Windows

public class ProgressControl
{
    public static ProgressControl? Instance { get; private set; } = new();   

    public void ShowPopover() { }
}

#endif
