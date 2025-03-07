import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import './FolderView.css'
import VirtualTable, { OnSort, SelectableItem, SpecialKeys, TableColumns, VirtualTableHandle } from 'virtual-table-react'
import { checkController, Controller, createEmptyController, showError } from '../controller/controller'
import { ROOT } from '../controller/root'
import RestrictionView, { RestrictionViewHandle } from './RestrictionView'
import { ExifData, RequestError, Version } from '../requests/requests'
import { initializeHistory } from '../history'
import { isWindows } from '../globals'
import { Subscription } from 'rxjs'
import { ServiceStartMode, ServiceStatus } from '../enums'
import { DialogContext, DialogHandle } from 'web-dialog-react'
import { getDirectoryChangedEvents, DirectoryChangedType } from '../requests/events'

//// eslint-disable-next-line 
//declare const webViewDragStart: (path: string, fileList: string[]) => void

export interface FolderViewItem extends SelectableItem {
    name:         string
    size?:        number
    isParent?:    boolean
    isDirectory?: boolean
    // Root item
    description?: string
    mountPoint?:  string
    isMounted?:   boolean
    // FileSystem item
    iconPath?:    string
    time?:        string
    exifData?:    ExifData
    version?:     Version
    isHidden?:    boolean
    // Remotes item
    ipAddress?:   string
    isAndroid?:   boolean
    isNew?: boolean
    // ExtendedRename
    newName?:     string|null
    // Favorites
    path?: string | null
    // Service
    status?: ServiceStatus
    startType?: ServiceStartMode
}

export type FolderViewHandle = {
    id: string
    setFocus: () => void
    refresh: (forceShowHidden?: boolean) => void
    selectAll: () => void
    selectNone: () => void
    changePath: (path: string) => void
    getPath: () => string
    rename: () => void
    extendedRename: (dialog: DialogHandle) => void
    renameAsCopy: () => void
    createFolder: () => void
    deleteItems: () => void
    getController: () => Controller
    getItems: () => FolderViewItem[]
    processEnter: (item: FolderViewItem, keys: SpecialKeys, otherPath?: string)=>Promise<void>
    getSelectedItems: ()=> FolderViewItem[]
}

interface ItemCount {
    fileCount: number
    dirCount: number
}

interface FolderViewProp {
    id: string
    showHidden: boolean
    onFocus: () => void
    onPathChanged: (path: string, isDir: boolean, latitude?: number, longitude?: number) => void
    onItemsChanged: (count: ItemCount) => void
    onCopy: (move: boolean) => void
    onEnter: (item: FolderViewItem, keys: SpecialKeys) => void
    setError: (error: string) => void
    //statusText: string | null
    setStatusText: (text: string|null)=>void
}

const FolderView = forwardRef<FolderViewHandle, FolderViewProp>(({ id, showHidden, onFocus, onPathChanged, onItemsChanged,
        onCopy, onEnter, setError, setStatusText  }, ref) => {

    useImperativeHandle(ref, () => ({
        id,
        setFocus() { virtualTable.current?.setFocus() },
        refresh,
        selectAll() {
            if (controller.current.itemsSelectable)
                setItems(items.map((n) => setSelection(n, true)))
            controller.current.onSelectionChanged(items)
        },
        selectNone() {
            if (controller.current.itemsSelectable)
                setItems(items.map((n) => setSelection(n, false)))
            controller.current.onSelectionChanged(items)
        },
        changePath(path: string) {
            changePath(id, path, showHidden)
        },
        getPath() { return path },
        rename,
        async extendedRename(dialog: DialogHandle) {
            try {
                const newController = await controller.current.extendedRename(controller.current, dialog)
                restrictionView.current?.reset()
                controller.current = newController
                virtualTable.current?.setColumns(setWidths(controller.current.getColumns()))
                controller.current.onSelectionChanged(items)
            } catch (err) {
                if (err instanceof RequestError) 
                    controller.current.onSelectionChanged(items)
                else 
				    console.error(err)
            }
            // TODO
            // controller.current.onSelectionChanged(items)
            // setItems(items.map(n => n))
        },
        renameAsCopy,
        createFolder,
        deleteItems,
        getController: () => controller.current,
        getItems: () => items,
        getSelectedItems,
        processEnter
    }))
    
    const restrictionView = useRef<RestrictionViewHandle>(null)
    const input = useRef<HTMLInputElement|null>(null)

    const virtualTable = useRef<VirtualTableHandle<FolderViewItem>>(null)
    const controller = useRef<Controller>(createEmptyController())
    const sortIndex = useRef(0)
    const sortDescending = useRef(false)
    const itemCount = useRef({ fileCount: 0, dirCount: 0 })
    const extendedItemsPendingRefCount = useRef(0)
    
    const [items, setStateItems] = useState([] as FolderViewItem[])
    const [path, setPath] = useState("")
    const [dragStarted, setDragStarted] = useState(false)
    const [dragging, setDragging] = useState(false)

    const history = useRef(initializeHistory())
    const dragEnterRefs = useRef(0)

    //const subscription = useRef<Subscription | null>(null)
    const refItems = useRef(items)
    const directoryChangedSubscription = useRef<Subscription | null>(null)
    const exifTimeSubscription = useRef<Subscription | null>(null)
    const extendedDataSubscription = useRef<Subscription | null>(null)

    const dialog = useContext(DialogContext)

    const setItems = useCallback((items: FolderViewItem[], dirCount?: number, fileCount?: number) => {
        setStateItems(items)
        refItems.current = items
        if (dirCount != undefined || fileCount != undefined) {
            itemCount.current = { dirCount: dirCount || 0, fileCount: fileCount || 0 }
            onItemsChanged(itemCount.current)
        }
    }, [onItemsChanged])

    // const onActualizedItems = useCallback((actualizedItems: FolderViewItem[]) => {
    //     const newItems = items.map(n => {
    //         const changedItem = actualizedItems.find(i => i.name == n.name)
    //         return changedItem
    //             ? changedItem
    //             : n
    //     })
    //     setItems(newItems)
    // }, [items, setItems])

    // useEffect(() => {
    //     if (isWindows()) {
    //         subscription.current?.unsubscribe()
    //         subscription.current = folderViewItemsChangedEvents.subscribe(onActualizedItems)
    //     }
    // }, [onActualizedItems])
    
    useEffect(() => {
        directoryChangedSubscription.current?.unsubscribe()
        directoryChangedSubscription.current = getDirectoryChangedEvents(id).subscribe(e => {
            const selected = refItems.current[virtualTable.current?.getPosition() || 0].name
            const newItems = controller.current.getPath() == e.path
                ? controller.current.updateItems(refItems.current, sortIndex.current, sortDescending.current, e)
                : null
            if (newItems) {
                const newPos = e.type != DirectoryChangedType.Deleted || selected != e.item.name
                    ? newItems.findIndex(n => n.name == selected)
                    : 0
                const dirs = e.type == DirectoryChangedType.Deleted || e.type == DirectoryChangedType.Created
                    ? newItems.filter(n => n.isDirectory).length - 1
                    : undefined
                const files = dirs != undefined
                    ? newItems.length - dirs - 1
                    : undefined
                setItems(newItems, dirs, files)
                if (newPos != -1)
                    virtualTable.current?.setPosition(newPos, newItems)
            }
        })

        exifTimeSubscription.current?.unsubscribe()
        // exifTimeSubscription.current = exifTimeEvents.subscribe(e => {
        //     if (e.path == controller.current.getPath()) {
        //         const newItems = refItems.current.map(n => n.name == e.name
        //             ? { ...n, exifDate: e.exif } as FolderViewItem
        //             : n as FolderViewItem)
        //         setItems(controller.current.sort(newItems, sortIndex.current, sortDescending.current))
        //     }
        // }) 

        extendedDataSubscription.current?.unsubscribe()
        // extendedDataSubscription.current = extendedDataEvents.subscribe(e => {
        //     if (e.path == controller.current.getPath()) {
        //         const newItems = refItems.current.map(n => n.name == e.name
        //             ? { ...n, version: e.version } as FolderViewItem
        //             : n as FolderViewItem)
        //         setItems(controller.current.sort(newItems, sortIndex.current, sortDescending.current))
        //     }
        // }) 

    }, [id, controller, setItems])

    const withSelectedItem = <T,>(withSelected: (item: FolderViewItem) => T) => {
        const items = getSelectedItems()
        return items?.length == 1
            ? withSelected(items[0])
            : null
    }

    const getSelectedItems = () => {

        const checkParent = (item: FolderViewItem) => !item.isParent ? item : null

        const selected = items.filter(n => n.isSelected)
        return selected.length > 0
            ? selected
            : [checkParent(items[virtualTable.current?.getPosition() ?? 0])].filter(n => n != null) as FolderViewItem[]
    }
    
    const onSort = async (sort: OnSort) => {
        sortIndex.current = sort.isSubColumn ? 10 : sort.column
        sortDescending.current = sort.isDescending
        const newItems = controller.current.sort(items, sortIndex.current, sortDescending.current)
        setItems(newItems)
        const name = items[virtualTable.current?.getPosition() ?? 0].name
        virtualTable.current?.setPosition(newItems.findIndex(n => n.name == name))
    }

    const getWidthsId = () => `${id}-${controller.current.id}-widths`

    const onColumnWidths = (widths: number[]) => {
        localStorage.setItem(getWidthsId(), JSON.stringify(widths))
	} 

    const refPath = useRef("")

    useEffect(() => virtualTable.current?.setFocus(), [])

    useEffect(() => {
        changePath(id, localStorage.getItem(`${id}-lastPath`) ?? ROOT, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const setWidths = (columns: TableColumns<FolderViewItem>) => {
        const widthstr = localStorage.getItem(getWidthsId())
        const widths = widthstr ? JSON.parse(widthstr) as number[] : null
        return widths
            ? {
                ...columns, columns: columns.columns.map((n, i) => ({...n, width: widths![i]}))
            }
            : columns
    }

    const changePath = async (id: string, path: string, showHidden: boolean, latestPath?: string, mount?: boolean, fromBacklog?: boolean, checkPosition?: (checkItem: FolderViewItem) => boolean) => {
        
        controller.current.cancelExtendedItems(id)
        restrictionView.current?.reset()
        const controllerChanged = checkController(path, controller.current)
        try {
            const res = await controllerChanged.controller.getItems(id, path, showHidden, sortIndex.current, sortDescending.current, mount || false, dialog)
            if (controllerChanged.changed) {
                controller.current = controllerChanged.controller
                virtualTable.current?.setColumns(setWidths(controller.current.getColumns()))
            }
            setPath(res.path)
            setItems(res.items, res.dirCount, res.fileCount)
            const pos =
                latestPath
                    ? res.items.findIndex(n => n.name == latestPath)
                    : checkPosition
                        ? res.items.findIndex(n => checkPosition(n))
                        : 0
            virtualTable.current?.setInitialPosition(pos, res.items.length)
            refPath.current = res.path
            localStorage.setItem(`${id}-lastPath`, res.path)
            if (!fromBacklog)
                history.current?.set(res.path)
                 
            setStatusText("Erweiterte Infos werden abgerufen...")
            extendedItemsPendingRefCount.current++

            try {
                const extended = await controller.current.getExtendedItems(id, res.path, res.items)
                if (--extendedItemsPendingRefCount.current <= 0) {
                    extendedItemsPendingRefCount.current = 0
                    setStatusText(null)
                }
                if (extended.path == refPath.current) {
                    const items = controller.current.setExtendedItems(res.items, extended, sortIndex.current, sortDescending.current)
                    const ri = restrictionView.current?.setExtendedItems(items)
                    setItems(ri || items)
                }
            } catch {
                if (--extendedItemsPendingRefCount.current <= 0) {
                    extendedItemsPendingRefCount.current = 0
                    setStatusText(null)
                }
            }
        } catch (err) {
            if (err instanceof RequestError) {
                console.log("err", err, controller.current.getPath())
                setPath(controller.current.getPath())
                showError(err, setError)
            } else 
                console.error(err)
        }
    }

    const processEnter = async (item: FolderViewItem, keys: SpecialKeys, otherPath?: string) => {
        try {
            const res = await controller.current.onEnter({ path, item, keys, dialog, setError, refresh, selectedItems: getSelectedItems(), items, otherPath })
            if (!res.processed && res.pathToSet)
                changePath(id, res.pathToSet, showHidden, res.latestPath, res.mount)
        } catch (err) {
            if (err instanceof RequestError)
                showError(err, setError)
            else 
                console.error(err)
        }
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.code == "Enter") {
            changePath(id, path, showHidden)
            virtualTable.current?.setFocus()
            e.stopPropagation()
            e.preventDefault()
        }
    }

    const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) => 
        setTimeout(() => e.target.select())
    
    const toggleSelection = (item: FolderViewItem) => {
        if (!item.isParent && !item.isNew)
            item.isSelected = !item.isSelected
        return item
    }
        
    const setSelection = (item: FolderViewItem, set: boolean) => {
        if (!item.isParent && !item.isNew)
            item.isSelected = set
        return item
    }

    const onPositionChanged = useCallback(
        (item: FolderViewItem) => onPathChanged(controller.current.appendPath(path, item.name),
        item.isDirectory == true, item.exifData?.latitude, item.exifData?.longitude),
        [path, onPathChanged])         

    const onKeyDown = async (evt: React.KeyboardEvent) => {
        switch (evt.code) {
            case "Insert":
                if (controller.current.itemsSelectable) {
                    setItems(items.map((n, i) => i != virtualTable.current?.getPosition() ? n : toggleSelection(n)))
                    virtualTable.current?.setPosition(virtualTable.current.getPosition() + 1)
                    controller.current.onSelectionChanged(items)
                    evt.preventDefault()
                    evt.stopPropagation()
                }
                break
            case "Home":
                if (controller.current.itemsSelectable) 
                    setItems(items.map((n, i) => setSelection(n, i <= (virtualTable.current?.getPosition() ?? 0))))
                controller.current.onSelectionChanged(items)
                evt.preventDefault()
                evt.stopPropagation()
                break
            case "End":
                if (controller.current.itemsSelectable) 
                    setItems(items.map((n, i) => setSelection(n, i >= (virtualTable.current?.getPosition() ?? 0))))
                controller.current.onSelectionChanged(items)                    
                evt.preventDefault()
                evt.stopPropagation()
                break
            case "Space": {
                const ri = restrictionView.current?.checkKey(" ")
                if (ri) {
                    virtualTable.current?.setPosition(0)
                    setItems(ri)
                } else if (controller.current.itemsSelectable)
                    setItems(items.map((n, i) => i != virtualTable.current?.getPosition() ? n : toggleSelection(n)))
                controller.current.onSelectionChanged(items)
                evt.preventDefault()
                evt.stopPropagation()
                break
            }
            case "Escape":
                if (!checkRestricted(evt.key)) {
                    if (controller.current.itemsSelectable) 
                        setItems(items.map((n) => setSelection(n, false)))
                    controller.current.onSelectionChanged(items)                    
                }
                break                
            case "Delete":
                deleteItems()
                break
            case "Backspace":
                if (!checkRestricted(evt.key)) {
                    const path = history.current?.get(evt.shiftKey)
                    if (path)
                        changePath(id, path, showHidden, undefined, undefined, true)
                }
                break
            default:
                checkRestricted(evt.key)
                break
        }
    }

    const checkRestricted = (key: string) => {
        const restrictedItems = restrictionView.current?.checkKey(key)
        if (restrictedItems) {
            virtualTable.current?.setPosition(0)
            setItems(restrictedItems)
            return true
        } else
            return false
    }

    const onFocusChanged = useCallback(() => {
        onFocus()
        const pos = virtualTable.current?.getPosition() ?? 0
        const item = pos < items.length ? items[pos] : null 
        if (item)
            onPositionChanged(item)
        onItemsChanged(itemCount.current)
    }, [items, onFocus, onPositionChanged, onItemsChanged]) 

    const refresh = (forceShowHidden?: boolean, checkPosition?: (checkItem: FolderViewItem) => boolean) => {
        if (path)
            changePath(id, path, forceShowHidden !== false && forceShowHidden !== true ? showHidden : forceShowHidden, undefined, undefined, undefined, checkPosition)
    }

    const rename = () => 
        withSelectedItem(async item => {
            virtualTable.current?.setFocus()
            try {
                const newName = await controller.current.rename(path, item, dialog)
                refresh(false, n => n.name == newName)
            } catch (err) {
                if (err instanceof RequestError) 
                    showError(err, setError);
                else 
                    console.error(err)
            }
        })
    
    const renameAsCopy = async () => {
        virtualTable.current?.setFocus()
        const items = getSelectedItems()
        if (items?.length == 1) {
            try {
                await controller.current.renameAsCopy(path, items[0], dialog)
                refresh()
            } catch (err) {
                if (err instanceof RequestError) 
                    showError(err, setError);
                else 
                    console.error(err)
            }
        }
    }

    const createFolder = async () => {
        virtualTable.current?.setFocus()
        if (dialog) {
            try {
                const newName = await controller.current
                    .createFolder(path, items[virtualTable.current?.getPosition() ?? 0], dialog)
                refresh(false, n => n.name == newName)
            } catch (err) {
                if (err instanceof RequestError)
                    showError(err, setError);
                else
                    console.error(err)
            }
        }
    }

    const deleteItems = async () => {
        virtualTable.current?.setFocus()
        const items = getSelectedItems()
        try {
            if (items.length > 0 && dialog) {
                await controller.current.deleteItems(path, items, dialog)
                refresh()
            }
        } catch (err) {
            if (err instanceof RequestError) {
                console.log("err", err, controller.current.getPath())
                showError(err, setError)
            } else 
                console.error(err)
        }
    }

	const onItemClick = (item: FolderViewItem, _: number, ctrlKey: boolean) => {
		if (ctrlKey == true)
			toggleSelection(item)
	}

    const onDragStart = async (evt: React.DragEvent) => {
        const items = getSelectedItems().map(n => n.name)
        if (items.length > 0) {
            setDragStarted(true)
            internalDrag = true
            evt.preventDefault()
            //await WebView.startDragFiles(items.map(i => `${path}\\${i}`))
            setDragStarted(false)
            internalDrag = false
        } 
    }

    const onDragEnter = () => {
        if (!dragStarted) {
            dragEnterRefs.current++
            setDragging(true)
        }
    }

    const onDragLeave = () => {
        if (!dragStarted && --dragEnterRefs.current == 0)
            setDragging(false)
    }        

    const onDragOver = (evt: React.DragEvent) => {
        evt.preventDefault()
        evt.stopPropagation()
        evt.dataTransfer.dropEffect = evt.shiftKey ? "move" : "copy"
    }

    const onDrop = async (evt: React.DragEvent) => {
        setDragging(false)
        const internal = internalDrag
        internalDrag = false
        dragEnterRefs.current = 0
        evt.preventDefault()
        if (internal) {
            if (!dragStarted)
                onCopy(evt.shiftKey)
        }
        else {
            // const files = await WebView.filesDropped(evt.dataTransfer)
            // try {
            //     await webViewRequest("nativecopy", {
            //         files, id, move: evt.shiftKey, target: path
            //     })
            //     refresh()
            // } catch (err) {
            //     if (err instanceof RequestError) 
            //         showError(err, setError)
            // }
        }
    }

    return (
        <div className={`folder${dragging ? " dragging" : ""}`} onFocus={onFocusChanged}
            onDragEnter={isWindows() ? onDragEnter : undefined} onDragOver={isWindows() ? onDragOver : undefined}
            onDragLeave={isWindows() ? onDragLeave : undefined} onDrop={isWindows() ? onDrop : undefined}>
            <input ref={input} className="pathInput" spellCheck={false} value={path} onChange={onInputChange} onKeyDown={onInputKeyDown} onFocus={onInputFocus} />
            <div className={`tableContainer${dragStarted ? " dragStarted" : ""}`} onKeyDown={onKeyDown} >
                <VirtualTable ref={virtualTable} items={items} onSort={onSort} onColumnWidths={onColumnWidths} onItemClick={onItemClick}
                    onDragStart={isWindows() ? onDragStart : undefined} onEnter={onEnter} onPosition={onPositionChanged} />
            </div>
            <RestrictionView items={items} ref={restrictionView} />
        </div>
    )
})

let internalDrag = false

export default FolderView

// TODO Collect all errors in list, show ! in StatusBar, When clicked on, a dialog is shown => delete all button

// TODO Drag n drop from outside copy hidden file

// TODO GetNetShares (Windows)
// TODO Windows append home drive to root

// TODO Viewer .. => Directory Info

// using System.IO;

// private long GetTotalFreeSpace(string driveName)
// {
//     foreach (DriveInfo drive in DriveInfo.GetDrives())
//     {
//         if (drive.IsReady && drive.Name == driveName)
//         {
//             return drive.TotalFreeSpace;
//         }
//     }
//     return -1;
// }

// TODO .. => Btn safe reject sudo eject sde1
// TODO Viewer text in textedit with save option
// TODO Statusbar nowrap text-overflow ellipses
// TODO https://stackoverflow.com/questions/71581401/drag-a-file-from-my-gtk-app-to-another-app-not-the-other-way-around

// WindowsIdentity.RunImpersonated(userHandle, () =>
// {
//     // do whatever you want as this user.
// });
// or
// var result = WindowsIdentity.RunImpersonated(userHandle, () =>
// {
//     // do whatever you want as this user.
//     return result;
// });
// await WindowsIdentity.RunImpersonatedAsync(userHandle, async () =>
// {
//     // do whatever you want as this user.
// });
// or
// var result = await WindowsIdentity.RunImpersonated(userHandle, async () =>
// {
//     // do whatever you want as this user.
//     return result;
// });
// [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
// internal static extern bool LogonUser(String lpszUsername, String lpszDomain, String lpszPassword, int dwLogonType, int dwLogonProvider, out IntPtr phToken);