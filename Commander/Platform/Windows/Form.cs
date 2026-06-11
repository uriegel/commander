#if Windows

using WebWindowNetCore.Windows;

static class Form
{
    public static WebWindow WebWindow { get; private set; } = null!;
    public static async void OnCreate(WebWindow window)
    {
        WebWindow = window;
        // Form.form.Resize += (_, __) =>
        //     Requests.SendJson(new(null, EventCmd.WindowState, new EventData { Maximized = form.WindowState == System.Windows.Forms.FormWindowState.Maximized }));
        // await Task.Delay(1000);
        // if (form.WindowState == System.Windows.Forms.FormWindowState.Maximized)
        //     Requests.SendJson(new(null, EventCmd.WindowState, new EventData { Maximized = true }));
        // webView = form.Controls.OfType< Panel>().FirstOrDefault()?.Controls.OfType<Microsoft.Web.WebView2.WinForms.WebView2>().FirstOrDefault();
    }
}

#endif