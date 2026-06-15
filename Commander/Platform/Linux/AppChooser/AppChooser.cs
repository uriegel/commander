using CsTools.Extensions;
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

        listbox.SetHeaderFunc<ListItem>((current, previous) =>
        {
            var currentListitem = current?.GetChild<ListItem>();
            var previousListitem = previous?.GetChild<ListItem>();
            if (previous == null && currentListitem?.IsRecommended == true)
                current?.CreateHeader("Empfohlene Apps");
            if (previousListitem?.IsRecommended == true && currentListitem?.IsRecommended == false)
                current?.CreateHeader("Alle Apps");
        });

        var keyController = KeyEventController.New();
        keyController.OnKeyPressed((chr, mod) =>
        {
            var row = listbox.GetSelectedRow().GetChild<Box>();
            Console.WriteLine($"Open file with {row?.GetManagedData<string>("data")}");
            return false;
        });
        AddController(keyController);

        EventController CreatePressed() => ClickGesture.New().SideEffect(c => c.OnPressed((n, x, y) =>
        {
            if (n == 2)
            {
                var row = listbox.GetSelectedRow().GetChild<Box>();
                Console.WriteLine($"Open file with {row?.GetManagedData<string>("data")}");
            }
        }));

        var contentType = Gio.GuessContentType(fileName) ?? "none";
        using var defaultApp = GAppInfo.GetDefault(contentType);
        listbox.AppendFromTemplate("listitem", b => new ListItem(b, defaultApp.GetIcon(), defaultApp.Name, true)
            .RegisterWidget()
            .SideEffect(n => AttachData(n, defaultApp.Executable)));
        using var recommendedApps = GAppInfo.GetRecommendedApps(contentType);
        foreach (var appinfo in recommendedApps.OrderBy(n => n.Name).Where(n => n.ShouldShow && n.Name != defaultApp.Name))
            listbox.AppendFromTemplate("listitem", b => new ListItem(b, appinfo.GetIcon(), appinfo.Name, true)
                .RegisterWidget()
                .SideEffect(n => AttachData(n, appinfo.Executable)));
        using var apps = GAppInfo.GetAllApps();
        foreach (var appinfo in apps.OrderBy(n => n.Name).Where(n => n.ShouldShow))
            listbox.AppendFromTemplate("listitem", b => new ListItem(b, appinfo.GetIcon(), appinfo.Name)
                .RegisterWidget()
                .SideEffect(n => AttachData(n, appinfo.Executable)));

        void AttachData(ListItem listItem, string? executable)
        {
            listItem.AddController(CreatePressed());
            listItem.SetManagedData("data", executable ?? "");
        }

        FocusListBox();

        async void FocusListBox()
        {
            await Task.Delay(600);
            listbox.GrabFocus();
        }
        
    }

    [Widget]
    readonly Button openBtn = null!;

    [Widget]
    readonly Label description = null!;

    [Widget]
    readonly ListBox listbox = null!;
}

static class MyWindowExtensions
{
    public static void CreateHeader(this ListBoxRow listBoxRow, string header)
    {
        using var builder = Builder.FromDotNetResource("listitemheader");
        listBoxRow.SetHeader(new ListItemHeader(builder, header));
    }
}

// TODO gtk_list_box_get_row_at_index 
// TODO gtk_list_box_get_selected_row