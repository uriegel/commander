#if Windows

using System.Runtime.InteropServices;
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

    public static void Mist()
    {
        var schSCManager = OpenSCManager(null, null, SERVICE_QUERY_CONFIG);
        var schService = OpenService(schSCManager, "Power", SERVICE_QUERY_CONFIG);
        bool success = QueryServiceConfig2(schService, ServiceConfig.DESCRIPTION, IntPtr.Zero, 0, out var bytesNeeded);
        if (!success && Marshal.GetLastWin32Error() == ERROR_INSUFFICIENT_BUFFER)
        {

            var buffer = Marshal.AllocHGlobal((int)bytesNeeded);
            bool success2 = QueryServiceConfig2(schService, ServiceConfig.DESCRIPTION, buffer, bytesNeeded, out bytesNeeded);
            if (!success2)
                return;
            var description = (SERVICE_DESCRIPTION)Marshal.PtrToStructure(buffer, typeof(SERVICE_DESCRIPTION));
            Marshal.FreeHGlobal(buffer);
            CloseServiceHandle(schService);
            CloseServiceHandle(schSCManager);
        }

    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct SERVICE_DESCRIPTION
    {
        public string lpDescription;
    }

    [DllImport("advapi32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern IntPtr OpenSCManager(string? lpMachineName, string? lpDatabaseName, uint dwDesiredAccess);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    static extern IntPtr OpenService(IntPtr hSCManager, string lpServiceName, uint dwDesiredAccess);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    static extern bool QueryServiceConfig2(IntPtr hService, ServiceConfig dwInfoLevel, IntPtr lpBuffer, uint cbBufSize, out uint pcbBytesNeeded);

    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool CloseServiceHandle(IntPtr hSCObject);

    const uint SERVICE_QUERY_CONFIG = 0x0001;
    const uint ERROR_INSUFFICIENT_BUFFER = 122;

    public enum ServiceConfig 
    {
        DESCRIPTION = 1,
        FAILURE_ACTIONS,
        DELAYED_AUTO_START_INFO,
        FAILURE_ACTIONS_FLAG,
        SERVICE_SID_INFO,
        REQUIRED_PRIVILEGES_INFO,
        PRESHUTDOWN_INFO,
        TRIGGER_INFO,
        PREFERRED_NODE,
        LAUNCH_PROTECTED = 12
    }
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

    const uint STANDARD_RIGHTS_REQUIRED = 0x000F0000;
    const uint SC_MANAGER_CONNECT = 0x0001;
    const uint SC_MANAGER_CREATE_SERVICE = 0x0002;
    const uint SC_MANAGER_ENUMERATE_SERVICE = 0x0004;
    const uint SC_MANAGER_LOCK = 0x0008;
    const uint SC_MANAGER_QUERY_LOCK_STATUS = 0x0010;
    const uint SC_MANAGER_MODIFY_BOOT_CONFIG = 0x0020;
    const uint SC_MANAGER_ALL_ACCESS = STANDARD_RIGHTS_REQUIRED | SC_MANAGER_CONNECT | SC_MANAGER_CREATE_SERVICE | SC_MANAGER_ENUMERATE_SERVICE | SC_MANAGER_LOCK | SC_MANAGER_QUERY_LOCK_STATUS | SC_MANAGER_MODIFY_BOOT_CONFIG;


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