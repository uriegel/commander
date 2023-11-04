#if Windows

using System.ServiceProcess;

record ServiceItem(
    string Name,
    string? Description,
    long? Size,
    bool IsMounted
);

static class Services
{
    public static Task<ServiceItem[]> Get(Empty _)
    {
        var services = ServiceController.GetServices();
        return Task.FromResult(Array.Empty<ServiceItem>());
    }
        // =>  (from n in DriveInfo
        //                 .GetDrives()
        //                 .Select(RootItem.Create)
        //                 .Append(new("zzz", "", 0, true))
        //     orderby n.IsMounted descending, n.Name
        //     select n.Name == "zzz" 
        //         ? n with { Name = "services" } 
        //         : n)
        //     .ToArray()
        //     .ToAsync();
}

#endif

    /*
 case "Dienste":
                        try
                        {
                            var services = ServiceController.GetServices();
                            dirIoItems = services.OrderBy(n => n.DisplayName).Select(n => Item.CreateServiceItem(n));
                            items = Enumerable.Repeat<Item>(Item.CreateParentItem("drives"), 1).Concat(dirIoItems).ToArray();
                            itemResult = new ItemResult("Dienste", items);
                            serviceStates[input.Id] = new ServiceStateProcessor(services, input.Id);
                        }
                        catch (Exception)
                        {
                        }
                        break;

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