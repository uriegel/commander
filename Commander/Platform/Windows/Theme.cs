#if Windows

static class Theme
{
    static bool darkMode = false;
    public static string GetAccentColor() => darkMode ? "#0073e5" : "#0070de";

    public static void StartChangeDetecting() { }
}

#endif