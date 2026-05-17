#if Windows

using System.Windows.Forms;

static class Form
{
    public static async void OnCreate(System.Windows.Forms.Form form)
    {
        Form.form = form;
        Form.form.Resize += (_, __) =>
            Requests.SendJson(new(null, EventCmd.WindowState, new EventData { Maximized = form.WindowState == System.Windows.Forms.FormWindowState.Maximized }));
        await Task.Delay(1000);
        if (form.WindowState == System.Windows.Forms.FormWindowState.Maximized)
            Requests.SendJson(new(null, EventCmd.WindowState, new EventData { Maximized = true }));
        webView = form.Controls.OfType< Panel>().FirstOrDefault()?.Controls.OfType<Microsoft.Web.WebView2.WinForms.WebView2>().FirstOrDefault();
    }

    public static void BeginInvoke(Action action) => form?.BeginInvoke(action);

    public static void Close() => form?.BeginInvoke(() => form?.Close());
    public static void Minimize() => form?.BeginInvoke(() => form?.WindowState = System.Windows.Forms.FormWindowState.Minimized);
    public static void Maximize() => form?.BeginInvoke(() => form?.WindowState = System.Windows.Forms.FormWindowState.Maximized);
    public static void Restore() => form?.BeginInvoke(() => form?.WindowState = System.Windows.Forms.FormWindowState.Normal);
    public static Task InvokeOnMainThread(Action action) => form?.InvokeAsync(action) ?? Task.CompletedTask;

    public static void SetFocus() => form?.BeginInvoke(async () => {
        form?.Activate();
        form?.BringToFront();
        webView?.Focus();
        form?.Focus();
    });

    static System.Windows.Forms.Form? form = null;
    static Microsoft.Web.WebView2.WinForms.WebView2? webView = null;
}

#endif