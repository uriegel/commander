using LinqExtensions.Extensions;

public class WebViewBuilder
{
    public WebViewBuilder InitialBounds(int width, int height)
        => this
                .SideEffect(n => Width = width)
                .SideEffect(n => Height = height);

    public WebViewBuilder Title(string title)
        => this.SideEffect(n => TitleString = title);

    public WebViewBuilder Url(string url)
        => this.SideEffect(n => UrlString = url);

    public WebViewBuilder ShowDevTools()
        => this.SideEffect(n => DevTools = true);
        
    public WebViewBuilder ConfigureHttp(int port = 20000)
        => this.SideEffect(n => HttpBuilder = new HttpBuilder(port));

    public WebView Build() => new WebView(this);
    internal WebViewBuilder() {}

    internal int Width { get; private set; } = 800;
    internal int Height  { get; private set; } = 600;
    internal string TitleString { get; private set; } = "";
    internal string? UrlString { get; private set; }
    internal HttpBuilder? HttpBuilder { get; private set; }
    internal bool DevTools { get; private set; }
}