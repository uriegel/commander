using AspNetExtensions;

record Events(string Theme)
{
    public static SseEventSource<Events> Source = SseEventSource<Events>.Create();   

    public static void StartEvents()   
        => global::Theme.StartThemeDetection(n => Source.Send(new(n)));
};