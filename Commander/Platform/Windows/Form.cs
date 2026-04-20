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
    }

    public static void Close() => form?.BeginInvoke(() => form?.Close());
    public static void Minimize() => form?.BeginInvoke(() => form?.WindowState = System.Windows.Forms.FormWindowState.Minimized);
    public static void Maximize() => form?.BeginInvoke(() => form?.WindowState = System.Windows.Forms.FormWindowState.Maximized);
    public static void Restore() => form?.BeginInvoke(() => form?.WindowState = System.Windows.Forms.FormWindowState.Normal);
    
    static System.Windows.Forms.Form? form = null;
}