import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react'
import './FolderView.css'
import VirtualTable, { OnSort, SelectableItem, SpecialKeys, TableColumns, VirtualTableHandle } from 'virtual-table-react'
import { checkController, checkResult, Controller, createEmptyController, showError } from '../controller/controller'
import { ROOT } from '../controller/root'
import RestrictionView, { RestrictionViewHandle } from './RestrictionView'
import { Version } from '../requests/requests'
import { initializeHistory } from '../history'
import { isWindows } from '../globals'
import { folderViewItemsChangedEvents } from '../requests/events'
import { Subscription } from 'rxjs'
import { ServiceStartMode, ServiceStatus } from '../enums'
import { DialogContext, DialogHandle } from 'web-dialog-react'

declare const webViewDropFiles: (id: string, move: boolean, paths: FileList)=>void
declare const webViewDragStart: (path: string, fileList: string[]) => void

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
    exifDate?:    string
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
    renameAsCopy: () => Promise<void>
    createFolder: () => void
    deleteItems: () => void
    getController: () => Controller
    getItems: () => FolderViewItem[]
    processEnter: (item: FolderViewItem, keys: SpecialKeys, otherPath?: string) => Promise<void>
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
    onPathChanged: (path: string, isDir: boolean) => void
    onItemsChanged: (count: ItemCount) => void
    onCopy: (move: boolean) => void
    onEnter: (item: FolderViewItem, keys: SpecialKeys) => Promise<void>
    setError: (error: string)=>void
}

const FolderView = forwardRef<FolderViewHandle, FolderViewProp>((
    { id, showHidden, onFocus, onPathChanged, onItemsChanged, onCopy, onEnter, setError },
    ref) => {

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
            changePath(path, showHidden)
        },
        getPath() { return path },
        rename,
        async extendedRename(dialog: DialogHandle | null) {
            const res = await controller.current.extendedRename(controller.current, dialog)
            if (res != null) {
                restrictionView.current?.reset()
                controller.current = res
                virtualTable.current?.setColumns(setWidths(controller.current.getColumns()))
            }
            controller.current.onSelectionChanged(items)
            setItems(items.map(n => n))
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
    const waitOnExtendedItems = useRef(false)
    
    const [items, setItems] = useState([] as FolderViewItem[])
    const [path, setPath] = useState("")
    const [dragStarted, setDragStarted] = useState(false)
    const [dragging, setDragging] = useState(false)

    const history = useRef(initializeHistory())
    const dragEnterRefs = useRef(0)

    const subscription = useRef<Subscription | null>(null)
    const dialog = useContext(DialogContext)

    const onActualizedItems = useCallback((actualizedItems: FolderViewItem[]) => {
        const newItems = items.map(n => {
            const changedItem = actualizedItems.find(i => i.name == n.name)
            return changedItem
                ? changedItem
                : n
        })
        setItems(newItems)
    }, [items])

    useEffect(() => {
        if (isWindows()) {
            subscription.current?.unsubscribe()
            subscription.current = folderViewItemsChangedEvents.subscribe(onActualizedItems)
        }
    }, [onActualizedItems])
    
    const withSelectedItem = <T,>(withSelected: (item: FolderViewItem)=>T) => {
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
        sortIndex.current = sort.column
        sortDescending.current = sort.isDescending
        const newItems = controller.current.sort(items, sort.isSubColumn ? 10 : sortIndex.current, sortDescending.current)
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
        changePath(localStorage.getItem(`${id}-lastPath`) ?? ROOT, false)
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

    const changePath = (path: string, showHidden: boolean, latestPath?: string, mount?: boolean, fromBacklog?: boolean) => {
        if (waitOnExtendedItems.current)
            controller.current.cancelExtendedItems(id)
        
        restrictionView.current?.reset()
        const controllerChanged = checkController(path, controller.current)
        controllerChanged.controller
            .getItems(path, showHidden, sortIndex.current, sortDescending.current, mount || false, dialog)
            .match(
                res => {
                    if (controllerChanged.changed) {
                        controller.current = controllerChanged.controller
                        virtualTable.current?.setColumns(setWidths(controller.current.getColumns()))
                    }
                    setPath(res.path)
                    setItems(res.items)
                    itemCount.current = { dirCount: res.dirCount, fileCount: res.fileCount }
                    onItemsChanged(itemCount.current)
                    const pos = latestPath ? res.items.findIndex(n => n.name == latestPath) : 0
                    virtualTable.current?.setInitialPosition(pos, res.items.length)
                    refPath.current = res.path
                    localStorage.setItem(`${id}-lastPath`, res.path)
                    if (!fromBacklog)
                        history.current?.set(res.path)
                    waitOnExtendedItems.current = true
                    // TODO
                    // const extendedInfoItems = await controller.current.getExtendedItems(id, items.path, items.items)
                    // waitOnExtendedItems.current = false
                    // if (extendedInfoItems.path == refPath.current) 
                    //     setItems(controller.current.setExtendedItems(items.items, extendedInfoItems))    
                },
                () => {
                    setPath(controller.current.getPath())
  
                    // when error leave all but show error in statusbar for 10 s
                    // TODO status bar white text on red
                    // TODO Path not found: Der Pfad wurde nicht gefunden
                    // TODO canceled
                    // TODO Access denied: Zugriff auf den Pfad nicht erlaubt
                    // if (items.error == IOError.PathNotFound) {
                    //     input.current?.focus()
                    //     return
                    // }
                }
            )
    }

    const processEnter = async (item: FolderViewItem, keys: SpecialKeys, otherPath?: string) => {
        const result = await controller.current.onEnter({path, item, keys, dialog, refresh, selectedItems: getSelectedItems(), items, otherPath})
        if (!result.processed && result.pathToSet) 
            changePath(result.pathToSet, showHidden, result.latestPath, result.mount)
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.code == "Enter") {
            changePath(path, showHidden)
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
        (item: FolderViewItem) => onPathChanged(controller.current.appendPath(path, item.name), item.isDirectory == true),
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
                        changePath(path, showHidden, undefined, undefined, true)
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

    const refresh = async (forceShowHidden?: boolean) =>
        changePath(path, forceShowHidden == undefined ? showHidden : forceShowHidden)

    const rename = () => 
        withSelectedItem(item => {
            virtualTable.current?.setFocus()
            controller.current.rename(path, item, dialog)
                .match(
                    () => refresh(),
                    err => showError(err, setError))
            // TODO when renamed select new file when changePath is finished
        })
    
    const renameAsCopy = async () => {
        virtualTable.current?.setFocus()
        const items = getSelectedItems()
        if (items?.length == 1) {
            const result = await controller.current.renameAsCopy(path, items[0], dialog)
            if (await checkResult(dialog, virtualTable.current, result))
               refresh() 
        }
    }
    const createFolder = async () => {
        virtualTable.current?.setFocus()
        if (dialog)
            controller.current.createFolder(path, items[virtualTable.current?.getPosition() ?? 0], dialog)
            .match(
                () => refresh(),
                err => showError(err, setError))
        // TODO when created select new folder when changePath is finished
    }

    const deleteItems = () => {
        virtualTable.current?.setFocus()
        const items = getSelectedItems()
        if (items.length > 0 && dialog)
            controller.current.deleteItems(path, items, dialog)
                .match(
                    () => refresh(),
                    err => showError(err, setError))
    }

    const onDragStart = async (evt: React.DragEvent) => {
        const items = getSelectedItems().map(n => n.name)
        if (items.length > 0) {
            setDragStarted(true)
            internalDrag = true
            evt.preventDefault()
            await webViewDragStart(path, items)
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
        if (internalDrag) 
            evt.dataTransfer.dropEffect = evt.shiftKey ? "move" : "copy"
    }

    const onDrop = (evt: React.DragEvent) => {
        setDragging(false)
        const internal = internalDrag
        internalDrag = false
        dragEnterRefs.current = 0
        evt.preventDefault()
        if (internal) {
            if (!dragStarted)
                onCopy(evt.shiftKey)
        }
        else
            webViewDropFiles(id, evt.shiftKey, evt.dataTransfer.files)
    }

    return (
        <div className={`folder${dragging ? " dragging" : ""}`} onFocus={onFocusChanged}
            onDragEnter={isWindows() ? onDragEnter : undefined} onDragOver={isWindows() ? onDragOver : undefined}
            onDragLeave={isWindows() ? onDragLeave : undefined} onDrop={isWindows() ? onDrop : undefined}>
            <input ref={input} className="pathInput" spellCheck={false} value={path} onChange={onInputChange} onKeyDown={onInputKeyDown} onFocus={onInputFocus} />
            <div className={`tableContainer${dragStarted ? " dragStarted" : ""}`} onKeyDown={onKeyDown} >
                <VirtualTable ref={virtualTable} items={items} onSort={onSort} onColumnWidths={onColumnWidths}
                    onDragStart={isWindows() ? onDragStart : undefined} onEnter={onEnter} onPosition={onPositionChanged} />
            </div>
            <RestrictionView items={items} ref={restrictionView} />
        </div>
    )
})

let internalDrag = false

export default FolderView


// TODO CheckIsModified Windows not working (when cache is disabled)
// TODO Ctrl+H as ToggleButton
// TODO F3 as ToggleButton
// TODO Hamburger Menu with Help overview
// TODO Linux Error when closing
// TODO Linux error handling Copy

// TODO Windows SaveBounds: window gets smaller every time

// TODO Selection Ctrl+Mouse click

// TODO Drag n drop from outside copy hidden file

// TODO GetNetShares (Windows)
// TODO Windows append home drive to root

// TODO Viewer .. => Directory Info

// TODO Dev tools not in Release mode

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
// TODO Arrow left and right in web-dialog button bar
// TODO Viewer text in textedit with save option
// TODO Take RenderRow in column
// TODO remote copy dirs
// TODO remote createFolder
// TODO remote delete files
// TODO remote rename file
// TODO remote move
// TODO Error from getItems/tooltip from dialog-box-react
// TODO Statusbar nowrap text-overflow ellipses
// TODO Viewer: directory info
// TODO Check windows webview: drop file/files/folder/folders
// TODO https://github.com/MicrosoftEdge/WebView2Feedback/issues/2313
// TODO Check gtk webview: drop file/files/folder/folders sudo apt install libwebkit2gtk-4.0-dev
// TODO https://stackoverflow.com/questions/71581401/drag-a-file-from-my-gtk-app-to-another-app-not-the-other-way-around

// TODO Drag n drop to outside (Linux) with Gtk feature (startDrag when leaving the app)


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