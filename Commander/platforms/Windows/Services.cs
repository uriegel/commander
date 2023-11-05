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
    public static Task<IOResult> Init(Empty _)
    {
        if (Interlocked.Increment(ref refCount) == 1)
        {
            services = ServiceController.GetServices();
            timer = new Timer(_ =>
            {
                var updateItems = services.Where(n =>
                {
                    var status = n.Status;
                    n.Refresh();
                    return status != n.Status;
                })
                    .Select(ServiceItem.Create)
                    .ToArray();
                if (updateItems != null && updateItems.Length != 0)
                    Events.ServiceItemsChanged(updateItems);
            }, null, 300, 300);
        }
        return Task.FromResult(new IOResult(IOError.NoError));
    }

    public static Task<ServiceItem[]> Get(Empty _)
        =>  services
                .Select(ServiceItem.Create)
                .ToArray()
                .ToAsync();

    public static Task<IOResult> CleanUp(Empty _)
    {
        if (Interlocked.Decrement(ref refCount) <= 0)
        {
            timer?.Dispose();
            timer = null;
            services = Array.Empty<ServiceController>();
        }
        return Task.FromResult(new IOResult(IOError.NoError));
    }

    static int refCount;
    static Timer? timer;
    static ServiceController[] services = Array.Empty<ServiceController>();
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


        */