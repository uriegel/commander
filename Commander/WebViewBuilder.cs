using LinqExtensions.Extensions;

public class WebViewBuilder
{
    public WebViewBuilder InitialBounds(int width, int height)
        => this
                .SideEffect(n => Width = width)
                .SideEffect(n => Height = height);

    public WebViewBuilder Title(string title)
        => this.SideEffect(n => WindowTitle = title);

    public WebView Build() => new WebView(this);

    internal WebViewBuilder() {}

    internal int Width { get; private set; } = 800;
    internal int Height  { get; private set; } = 600;
    internal string WindowTitle  { get; private set; } = "";
}