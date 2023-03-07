using GtkDotNet;

public class WebView
{
    public static WebViewBuilder Create()
        => new WebViewBuilder();

    public int Run()
        => new Application()
            .Run(app =>
            {
                app.EnableSynchronizationContext();

                var window = new Window();
                var webView = new GtkDotNet.WebView();
                window.Add(webView);
                webView.Settings.EnableDeveloperExtras = true;
                app.AddWindow(window);
                window.SetTitle(builder.WindowTitle);
                window.SetSizeRequest(builder.Width, builder.Height);
                window.ShowAll();
            });

    internal WebView(WebViewBuilder builder)
        => this.builder = builder;

    WebViewBuilder builder;
}