using Gtk4DotNet;

class AppChooser : AdwDialog
{
    public AppChooser(Builder builder, string name, string fileName) : base(builder, name)
    {
        description.Text = $"Wähle eine App, um <b>{fileName}</b> zu öffnen";
        SetDefaultWidget(openBtn);

        using var actiongroup = SimpleActionGroup.New("appchooser");
        actiongroup.AddActions(
            new SimpleAction("openfile", () => Console.WriteLine("Open File")),
            new SimpleAction("cancel", CloseDialog)
        );
        InsertActionGroup("appchooser", actiongroup);

        AddShortcuts(
            Shortcut.New("appchooser.openfile", "<Ctrl>O"),
            Shortcut.New("appchooser.cancel", "<Cancel>")
        );
    }

    [Widget]
    readonly Button openBtn = null!;

    [Widget]
    readonly Label description = null!;

    [Widget]
    readonly ListBox listbox = null!;
}