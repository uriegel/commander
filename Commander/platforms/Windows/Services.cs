#if Windows

using System.ServiceProcess;
using LinqTools;

record ServiceItem(
    string Name,
    string? Description
) {
    public static ServiceItem Create(ServiceController sc)
        => new(sc.DisplayName, "");
};

static class Services
{
    public static Task<ServiceItem[]> Get(Empty _)
        =>  ServiceController
                .GetServices()
                .Select(ServiceItem.Create)
                .ToArray()
                .ToAsync();
}

#endif



    /*


using System;
    using System.Diagnostics;
    using System.Runtime.InteropServices;

    namespace Test
    {
    internal class Program
    {

    #region "Constants"

    const uint ERROR_INSUFFICIENT_BUFFER = 122;

    const uint SERVICE_QUERY_CONFIG = 0x0001;
    const uint STANDARD_RIGHTS_REQUIRED = 0x000F0000;
    const uint SC_MANAGER_CONNECT = 0x0001;
    const uint SC_MANAGER_CREATE_SERVICE = 0x0002;
    const uint SC_MANAGER_ENUMERATE_SERVICE = 0x0004;
    const uint SC_MANAGER_LOCK = 0x0008;
    const uint SC_MANAGER_QUERY_LOCK_STATUS = 0x0010;
    const uint SC_MANAGER_MODIFY_BOOT_CONFIG = 0x0020;
    const uint SC_MANAGER_ALL_ACCESS = STANDARD_RIGHTS_REQUIRED | SC_MANAGER_CONNECT | SC_MANAGER_CREATE_SERVICE | SC_MANAGER_ENUMERATE_SERVICE | SC_MANAGER_LOCK | SC_MANAGER_QUERY_LOCK_STATUS | SC_MANAGER_MODIFY_BOOT_CONFIG;

    #endregion

    #region "Win32 APIs"

    [DllImport("advapi32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern IntPtr OpenSCManager(string lpMachineName, string lpDatabaseName, uint dwDesiredAccess);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    static extern IntPtr OpenService(IntPtr hSCManager, string lpServiceName, uint dwDesiredAccess);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    static extern bool QueryServiceConfig2(IntPtr hService, SERVICE_CONFIG dwInfoLevel, IntPtr lpBuffer, uint cbBufSize, out uint pcbBytesNeeded);

    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool CloseServiceHandle(IntPtr hSCObject);

    #endregion

    #region "Enumerations"

    public enum SERVICE_CONFIG : uint
    {
        SERVICE_CONFIG_DESCRIPTION = 1,
        SERVICE_CONFIG_FAILURE_ACTIONS = 2,
        SERVICE_CONFIG_DELAYED_AUTO_START_INFO = 3,
        SERVICE_CONFIG_FAILURE_ACTIONS_FLAG = 4,
        SERVICE_CONFIG_SERVICE_SID_INFO = 5,
        SERVICE_CONFIG_REQUIRED_PRIVILEGES_INFO = 6,
        SERVICE_CONFIG_PRESHUTDOWN_INFO = 7,
        SERVICE_CONFIG_TRIGGER_INFO = 8,
        SERVICE_CONFIG_PREFERRED_NODE = 9,
        SERVICE_CONFIG_LAUNCH_PROTECTED = 12
    }

    #endregion

    #region "Structures"

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct SERVICE_DESCRIPTION
    {
        public string lpDescription;
    }

    #endregion

    static void Main(string[] args)
    {

        Stopwatch stopwatch = new Stopwatch();
        stopwatch.Start();

        string svcName = "Power"; // Change this to the service name you want to get its description

        // Get the SCM database handle
        IntPtr schSCManager = OpenSCManager(null, null, SERVICE_QUERY_CONFIG);

        // Get the service handle

        IntPtr schService = OpenService(schSCManager, svcName, SERVICE_QUERY_CONFIG);
        if (schService == IntPtr.Zero)
        {
            Console.WriteLine("Win32 API OpenService failed ({0})", Marshal.GetLastWin32Error());
            return;
        }

        // Query the service description
        IntPtr buffer;

        bool success = QueryServiceConfig2(schService, SERVICE_CONFIG.SERVICE_CONFIG_DESCRIPTION, IntPtr.Zero, 0, out uint bytesNeeded);

        if (!success && Marshal.GetLastWin32Error() == ERROR_INSUFFICIENT_BUFFER)
        {

            buffer = Marshal.AllocHGlobal((int)bytesNeeded);
            bool success2 = QueryServiceConfig2(schService, SERVICE_CONFIG.SERVICE_CONFIG_DESCRIPTION, buffer, bytesNeeded, out bytesNeeded);

            if (!success2)
            {
                Console.WriteLine("Win32 API QueryServiceConfig2 failed ({0})", Marshal.GetLastWin32Error());
                return;
            }

        }
        else
        {
            Console.WriteLine("Win32 API QueryServiceConfig2 failed ({0})", Marshal.GetLastWin32Error());
            return;
        }

        // Read the description from the buffer
        SERVICE_DESCRIPTION description = (SERVICE_DESCRIPTION)Marshal.PtrToStructure(buffer, typeof(SERVICE_DESCRIPTION));
        Console.WriteLine("{0} service description: {1}", svcName, description.lpDescription);

        // Free the buffer and close the handles
        Marshal.FreeHGlobal(buffer);
        CloseServiceHandle(schService);
        CloseServiceHandle(schSCManager);

        stopwatch.Stop();
        Console.WriteLine("Elapsed Time: {0} Milliseconds", stopwatch.ElapsedMilliseconds.ToString());

        Console.ReadLine();

    }    

public static Item CreateServiceItem(ServiceController sc)
    {
        var item = new Item(Kind.Service, "images/serviceStopped.png", sc.DisplayName, default(DateTime), false)
        {
            ServiceName = sc.ServiceName
        };
        
        var serviceKey = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Services\" + item.ServiceName);
        if (serviceKey != null)
            item.startType = (int)serviceKey.GetValue("Start");
        switch (sc.Status)
        {
            case ServiceControllerStatus.Running:
                item.status = "An";
                item.ImageUrl = "images/service.png";
                break;
            case ServiceControllerStatus.Stopped:
                item.status = "Aus";
                break;
            case ServiceControllerStatus.StartPending:
                item.status = "Läuft an...";
                break;
            case ServiceControllerStatus.StopPending:
                item.status = "Fährt runter...";
                break;
        }
        return item;
    }                        

public static void StartServices(string[] services)
        {
            if (!AdminRights.IsAdmin())
                ElevatedOperation.StartServices(services);
            else
            {
                foreach (var service in services)
                {
                    try
                    {
                        var controller = new ServiceController(service);
                        controller.Start();
                    }
                    catch { }
                }
            }
        }
    
        public static void StopServices(string[] services)
        {
            if (!AdminRights.IsAdmin())
                ElevatedOperation.StopServices(services);
            else
            {
                foreach (var service in services)
                {
                    try
                    {
                        var controller = new ServiceController(service);
                        controller.Stop();
                    }
                    catch { }
                }
            }
        }

        void Timer_Elapsed(object sender, ElapsedEventArgs e)
        {
            var updateItems = services.Where(n =>
            {
                var status = n.Status;
                n.Refresh();
                return status != n.Status;
            }).Select(n => Item.CreateServiceItem(n));
            EventSession.UpdateServiceState(id, updateItems.ToArray());
        }

        */