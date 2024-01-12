#if Windows

using System.ServiceProcess;
using ClrWinApi;
using CsTools.Functional;
using CsTools.HttpRequest;

using static CsTools.Core;

record StartServicesParam(
    string[] Items
);


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
    public static AsyncResult<ServiceItem[], RequestError> Get()
        =>  Ok<ServiceItem[], RequestError>(
                (services.Length == 0
                ? Init()
                : services)
                    .Select(ServiceItem.Create)
                    .ToArray())
                .ToAsyncResult();

    public static AsyncResult<Nothing, RequestError> CleanUp()
    {
        if (Interlocked.Decrement(ref refCount) <= 0)
        {
            timer?.Dispose();
            timer = null;
            services = [];
        }
        return Ok<Nothing, RequestError>(nothing)
                .ToAsyncResult();
    }

    public static Task<IOResult> Start(StartServicesParam param)
    {
        try
        {
            foreach (var service in param.Items)
                new ServiceController(service).Start();
            return Task.FromResult(new IOResult(IOErrorType.NoError));
        }
        catch 
        {
            return Task.FromResult(new IOResult(IOErrorType.AccessDenied));
        }
    }

    public static Task<IOResult> Stop(StartServicesParam param)
    {
        try
        {
            foreach (var service in param.Items)
                new ServiceController(service).Stop();
            return Task.FromResult(new IOResult(IOErrorType.NoError));
        }
        catch 
        {
            return Task.FromResult(new IOResult(IOErrorType.AccessDenied));
        }
    }

    static ServiceController[] Init()
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
        return services;
    }


    static int refCount;
    static Timer? timer;
    static ServiceController[] services = Array.Empty<ServiceController>();
}

#endif
