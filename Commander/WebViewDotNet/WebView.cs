using GtkDotNet;

public class WebView
{
    public static WebViewBuilder Create()
        => new WebViewBuilder();

    public int Run(string gtkId = "de.uriegel.WebViewNetCore")
        => new Application(gtkId)
            .Run(app =>
            {
                app.EnableSynchronizationContext();

                var window = new Window();
                var webView = new GtkDotNet.WebView();
                window.Add(webView);
                webView.Settings.EnableDeveloperExtras = true;
                if (builder!.UrlString != null)
                    webView.LoadUri(builder!.UrlString);
                if (builder?.DevTools == true)
                    webView.Settings.EnableDeveloperExtras = true;
                app.AddWindow(window);
                window.SetTitle(builder?.TitleString);
                window.SetSizeRequest(builder!.Width, builder!.Height);
                window.ShowAll();
                builder = null;
            });

    internal WebView(WebViewBuilder builder)
        => this.builder = builder;

    WebViewBuilder? builder;
}