using System.Runtime.InteropServices;

static class ClrWinApi3
{

    [DllImport("Advapi32.dll", SetLastError = true)]
    public extern static int RegNotifyChangeKeyValue(IntPtr hKey, bool watchSubtree, int types, IntPtr hEvent, bool asynchronous);
}