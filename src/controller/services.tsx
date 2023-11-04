import { TableColumns } from "virtual-table-react"
import { FolderViewItem } from "../components/FolderView"
import IconName, { IconNameType } from "../components/IconName"
import { Controller, ControllerResult, ControllerType, addParent, sortItems } from "./controller"
import { getSortFunction } from "./filesystem"
import { ROOT } from "./root"

export const SERVICES = "services"

const renderRow = (item: FolderViewItem) => [
	(<IconName namePart={item.name} type={
        item.isParent
        ? IconNameType.Parent
        : item.isDirectory
        ? IconNameType.Folder
        : IconNameType.File}
        iconPath={item.name.getExtension()} />)
]

const getColumns = () => ({
	columns: [
        { name: "Name", isSortable: true },
        { name: "Status", isSortable: true },
        { name: "Starttyp", isSortable: true },
        { name: "Anmelden als", isSortable: true },
        { name: "Beschreibung", isSortable: true }
	],
	renderRow
} as TableColumns<FolderViewItem>)

const getItems = async (path: string, showHidden: boolean, sortIndex: number, sortDescending: boolean) => {
    const res = { items: [], dirCount: 0, fileCount: 0, path: "services" }
	// const res = await request<GetItemResult>("getremotefiles", {
	// 	path,
	// 	showHiddenItems: showHidden
	// })
	return { ...res, items: addParent(sort(res.items, sortIndex, sortDescending)) }
}

const sort = (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => 
	sortItems(items, getSortFunction(sortIndex, sortDescending), true) 

export const getServicesController = (controller: Controller | null): ControllerResult => 
    controller?.type == ControllerType.Services
    ? ({ changed: false, controller })
    : ({ changed: true, controller: { 
        type: ControllerType.Services, 
        id: SERVICES,
        getColumns,
        getItems,
        getExtendedItems: async () => ({ path: "", exifTimes: [], versions: [] }),
		setExtendedItems: items => items,
		cancelExtendedItems: async () => { },
		onEnter: async ({path, item}) => 
			item.isParent
			?  ({
				processed: false, 
				pathToSet: ROOT,
				latestPath: path
			}) 
			: { processed: true },
        sort,
        itemsSelectable: true,
        appendPath: (path: string, subPath: string) => path.appendPath(subPath),
		rename: async () => null,
		extendedRename: async () => null,
		renameAsCopy: async () => null,
        createFolder: async () => null,
        deleteItems: async () => null,
		onSelectionChanged: () => {}
    }})


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