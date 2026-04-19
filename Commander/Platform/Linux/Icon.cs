#if Linux

using System.Runtime.InteropServices;

static class Icon
{
    public static void Get(string name)
    {
        return;
        if (iconTheme == 0)
        {
            lock(Locker)
            {
                if (iconTheme == 0)
                {
                    var argc = 0;
                    nint p = 0;
                    Init(ref argc, ref p);
                    iconTheme = GetDefaultIconTheme();
                }
            }
        }
    }

    [DllImport(LibGtk, EntryPoint = "gtk_icon_theme_get_default", CallingConvention = CallingConvention.Cdecl)]
    extern static nint GetDefaultIconTheme();

    [DllImport(LibGtk, EntryPoint="gtk_init", CallingConvention = CallingConvention.Cdecl)]
    extern static void Init(ref int argc, ref IntPtr argv);


    static nint iconTheme = 0;

    static readonly object Locker = new(); 
    
    const string LibGtk = "libgtk-3.so";
}


#endif