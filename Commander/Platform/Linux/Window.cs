#if Linux
using Gtk4DotNet;
using WebWindowNetCore;

namespace Commander.Platform.Linux;

public class Window : AdwApplicationWindow
{
    public static ApplicationWindow OnActivation(WebWindow webWindow, WindowBuilder builder)
        => new Window(webWindow, builder);

    public Window(WebWindow webWindow, WindowBuilder builder) : base(builder)
    {
        DataContext = MainContext.Instance;

        banner
            .Binding("revealed", nameof(MainContext.ErrorText), BindingFlags.Default, v => v != null)
            .Binding("title", nameof(MainContext.ErrorText), BindingFlags.Default);
        banner.OnButtonClicked(() => banner.IsRevealed = false);
        previewMode.OnNotify("selected", FocusAfter(() => Requests.SendJson(new(null, EventCmd.PreviewMode, new EventData { PreviewMode = previewMode.SelectedPos.GetPreviewMode() }))));

        AddActions(
            new BoolAction("showhidden", false, FocusAfter1<bool>(show => Requests.SendJson(new(null, EventCmd.ShowHidden, new EventData { ShowHidden = show }))), "<Ctrl>H"),
            new SimpleAction("quit", FocusAfter(CloseWindow), "<Ctrl>Q"),
            new SimpleAction("devtools", FocusAfter(webWindow.ShowDevTools), "<CTRL><Shift>I"),
            new BoolAction("preview", false, FocusAfter1<bool>(show => Requests.SendJson(new(null, EventCmd.ShowViewer, new EventData { ShowViewer = show }))), "F3"),
            new SimpleAction("select-image", FocusAfter(() => previewMode.SelectedPos = 0), "<CTRL>1"),
            new SimpleAction("select-image-location", FocusAfter(() => previewMode.SelectedPos = 1), "<CTRL>2"),
            new SimpleAction("select-location", FocusAfter(() => previewMode.SelectedPos = 2), "<CTRL>3"),
            new SimpleAction("refresh", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "REFRESH" }))), "<CTRL>R"),
            new SimpleAction("favorites", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "FAVORITES" }))), "F1"),
            new SimpleAction("adaptpath", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "ADAPT_PATH" }))), "F9"),
            new SimpleAction("selectall", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "SEL_ALL" }))), "KP_Add"),
            new SimpleAction("selectnone", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "SEL_NONE" }))), "KP_Subtract"),
            new SimpleAction("createfolder", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "CREATE_FOLDER" }))), "F7"),
            new SimpleAction("delete", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "DELETE" }))), "Löschen"), // Shortcut not working!
            new SimpleAction("copy", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "COPY" }))), "F5"),
            new SimpleAction("move", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "MOVE" }))), "F6"),
            new SimpleAction("toggleselection", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "TOGGLE_SEL" }))), "Insert"),
            new SimpleAction("openwith", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "OPENWITH" }))), "<Ctrl>Return"),
            new SimpleAction("extendedrename", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "EXTENDED_RENAME" }))), "<Ctrl>F2"),
            new SimpleAction("renameascopy", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "RENAME_AS_COPY" }))), "<Shift>F2"),
            new SimpleAction("rename", FocusAfter(() => Requests.SendJson(new(null, EventCmd.Cmd, new EventData { Cmd = "RENAME" }))), "F2")
        );

        OnFinalize(Theme.StopChangeDetecting);
    }

    public void BackgroundActionActive() => progressRevealer.ShowPopover();

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