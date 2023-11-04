#if Windows

using System.ServiceProcess;
using ClrWinApi;
using LinqTools;

record ServiceItem(
    string Name,
    string? Description,
    ServiceControllerStatus Status,
    ServiceStartMode StartType
) {
    public static ServiceItem Create(ServiceController sc)
        => new(sc.DisplayName, GetServiceDescription(sc.ServiceName), sc.Status, sc.StartType);

    static string? GetServiceDescription(string serviceName)
    {
        var manager = Api.OpenSCManager(null, null, ServicesControlManagerDesiredAccess.Connect);
        var service = Api.OpenService(manager, serviceName, ServicesControlManagerDesiredAccess.Connect);
        var desc = Api.GetServiceDescription(service);
        Api.CloseServiceHandle(service);
        Api.CloseServiceHandle(manager);
        return desc;
    }
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