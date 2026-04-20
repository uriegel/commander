static class Form
{
    public static void OnCreate(System.Windows.Forms.Form form)
        => Form.form = form;

    public static void Close() => form?.BeginInvoke(() => form?.Close());
    public static void Minimize() => form?.BeginInvoke(() => form?.WindowState = System.Windows.Forms.FormWindowState.Minimized);
    public static void Maximize() => form?.BeginInvoke(() => form?.WindowState = System.Windows.Forms.FormWindowState.Maximized);
    
    static System.Windows.Forms.Form? form = null;
}