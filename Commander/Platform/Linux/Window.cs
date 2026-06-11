#if Linux
using Gtk4DotNet;

namespace Commander.Platform.Linux;

public class Window : AdwApplicationWindow
{
    public static ApplicationWindow OnActivation(Application app, WindowBuilder builder)
        => new Window(builder);

    public Window(WindowBuilder builder) : base(builder)
    {
        DataContext = MainContext.Instance;

        banner
            .Binding("revealed", nameof(MainContext.ErrorText), BindingFlags.Default, v => v != null)
            .Binding("title", nameof(MainContext.ErrorText), BindingFlags.Default);
        banner.OnButtonClicked(() => banner.IsRevealed = false);
        // TODO
        // previewMode.OnNotify("selected", FocusAfter1<bool>(
        //     pm => Requests.SendJson(new(null, EventCmd.PreviewMode, new EventData { PreviewMode = previewMode.SelectedPos.GetPreviewMode() }))));

        this.AddActions([
            new("showhidden", false, FocusAfter1<bool>(show => Requests.SendJson(new(null, EventCmd.ShowHidden, new EventData { ShowHidden = show }))), "<Ctrl>H"),
            new("quit", FocusAfter(CloseWindow), "<Ctrl>Q"),
            // TODO new("devtools", FocusAfter(webView.ShowDevTools), "F12"),
            new("preview", false, FocusAfter1<bool>(show => Requests.SendJson(new(null, EventCmd.ShowViewer, new EventData { ShowViewer = show }))), "F3"),
            new("select-image", FocusAfter(() => previewMode.SelectedPos = 0), "<CTRL>1"),
            new("select-image-location", FocusAfter(() => previewMode.SelectedPos = 1), "<CTRL>2"),
            new("select-location", FocusAfter(() => previewMode.SelectedPos = 2), "<CTRL>3"),
            new("refresh", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "REFRESH" }))), "<CTRL>R"),
            new("favorites", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "FAVORITES" }))), "F1"),
            new("adaptpath", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "ADAPT_PATH" }))), "F9"),
            new("selectall", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "SEL_ALL" }))), "KP_Add"),
            new("selectnone", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "SEL_NONE" }))), "KP_Subtract"),
            new("createfolder", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "CREATE_FOLDER" }))), "F7"),
            new("delete", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "DELETE" }))), "Löschen"), // Shortcut not working!
            new("copy", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "COPY" }))), "F5"),
            new("move", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "MOVE" }))), "F6"),
            new("toggleselection", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "TOGGLE_SEL" }))), "Insert"),
            new("openwith", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "OPENWITH" }))), "<Ctrl>Return"),
            new("extendedrename", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "EXTENDED_RENAME" }))), "<Ctrl>F2"),
            new("renameascopy", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "RENAME_AS_COPY" }))), "<Shift>F2"),
            new("rename", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "RENAME" }))), "F2")
        ]);
    }

    Action FocusAfter(Action action)
    {
        return Run;
        void Run()
        {
            action();
            webkit.GrabFocus();
        };
    }
    Action<T> FocusAfter1<T>(Action<T> action)
    {
        return Run;
        void Run(T t)
        {
            action(t);
            webkit.GrabFocus();
        };
    }

    [Widget]
    AdwBanner banner = null!;

    [Widget]
    DropDown previewMode = null!;

    [Widget(Name = "webview")]
    Gtk4DotNet.WebView webkit = null!;

    [Widget(Template = "progresscontrol")]
    ProgressControl progressRevealer = null!;
}
            // TODO
            // Handle.GetTemplateChild<ButtonHandle, AdwApplicationWindowHandle>("devtools")
            //     ?.OnClicked(webView.ShowDevTools);
       
static class WindowExtensions
{
    public static string GetPreviewMode(this int pm)
    => pm == 0
        ? PreviewMode.IMAGE
        : pm == 1
        ? PreviewMode.IMAGE_LOCATION
        : PreviewMode.LOCATION;
}

#endif