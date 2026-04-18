#if Linux
using GtkDotNet;

static class Gtk
{
    public static string GetAccentColor()
	{
		var settings = Settings.New("org.gnome.desktop.interface");
		var theme = settings.GetString("gtk-theme");
		var dark = theme?.EndsWith("-dark") == true;
		var color = settings.GetString("accent-color") ?? "blue";
		// const accent = process.platform == "win32" ? "lightblue" : getAccentColor()
        return (color, dark) switch
		{
			("orange", true) => "#d34615",
			("orange", false) => "#cb4314",
			("teal", true) => "#308280",
			("teal", false) => "#2e7e7c",
			("green", true) => "#4b8501",
			("green", false) => "#488001",
			("yellow", true) => "#9f6c00",
			("yellow", false) => "#9a6800",
			("red", true) => "#da3450",
			("red", false) => "#d82b48",
			("pink", true) => "#b34cb3",
			("pink", false) => "#ae4aae",
			("purple", true) => "#7764d8",
			("purple", false) => "#7360d7",
			("slate", true) => "#657b69",
			("slate", false) => "#627766",
			("brown", true) => "#92714a",
			("brown", false) => "#8c6c47",
			(_, true) => "#0073e5",
			(_, false) => "#0070de",
		};
    }
}
#endif