#if Linux
using GtkDotNet;

static class Gtk
{
    public static string GetAccentColor()
    {
        var color = Settings.New("org.gnome.desktop.interface").GetString("accent-color") ?? "blue";
        return color;
    // ipcMain.on('getAccentColor', (event: IpcMainEvent) => {

	// const accent = process.platform == "win32" ? "lightblue" : getAccentColor()
	// event.returnValue = accent == "orange"
	// 	? nativeTheme.shouldUseDarkColors ? "#d34615" : "#cb4314"
	// 	: event.returnValue = accent == "teal"
	// 	? nativeTheme.shouldUseDarkColors ? "#308280" : "#2e7e7c"
	// 	: event.returnValue = accent == "green"
	// 	? nativeTheme.shouldUseDarkColors ? "#4b8501" : "#488001"
	// 	: event.returnValue = accent == "yellow"
	// 	? nativeTheme.shouldUseDarkColors ? "#9f6c00" : "#9a6800"
	// 	: event.returnValue = accent == "red"
	// 	? nativeTheme.shouldUseDarkColors ? "#da3450" : "#d82b48"
	// 	: event.returnValue = accent == "pink"
	// 	? nativeTheme.shouldUseDarkColors ? "#b34cb3" : "#ae4aae"
	// 	: event.returnValue = accent == "purple"
	// 	? nativeTheme.shouldUseDarkColors ? "#7764d8" : "#7360d7"
	// 	: event.returnValue = accent == "slate"
	// 	? nativeTheme.shouldUseDarkColors ? "#657b69" : "#627766"
	// 	: event.returnValue = accent == "brown"
	// 	? nativeTheme.shouldUseDarkColors ? "#92714a" : "#8c6c47"
	// 	: nativeTheme.shouldUseDarkColors ? "#0073e5" : "#0070de"    
    }

}
#endif