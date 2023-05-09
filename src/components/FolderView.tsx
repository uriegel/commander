import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import './FolderView.css'
import VirtualTable, { OnSort, SelectableItem, SpecialKeys, TableColumns, VirtualTableHandle } from 'virtual-table-react'
import { checkController, checkResult, Controller, createEmptyController } from '../controller/controller'
import { ROOT } from '../controller/root'
import RestrictionView, { RestrictionViewHandle } from './RestrictionView'
import { Version } from '../requests/requests'
import { DialogHandle } from 'web-dialog-react'

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
}

export type FolderViewHandle = {
    id: string
    setFocus: () => void
    refresh: (forceShowHidden?: boolean) => void
    selectAll: () => void
    selectNone: () => void
    changePath: (path: string) => void
    getPath: () => string
    rename: () => Promise<void>
    extendedRename: (dialog: DialogHandle|null) => void
    createFolder: () => Promise<void>
    deleteItems: () => Promise<void>
    getController: () => Controller
    getItems: ()=> FolderViewItem[]
    getSelectedItems: ()=> FolderViewItem[]
}

interface ItemCount {
    fileCount: number
    dirCount: number
}

interface FolderViewProp {
    id: string
    showHidden: boolean
    dialog: DialogHandle|null,
    onFocus: () => void
    onPathChanged: (path: string, isDir: boolean) => void
    onItemsChanged: (count: ItemCount) => void
    onCopy: (move: boolean) => void
}

const FolderView = forwardRef<FolderViewHandle, FolderViewProp>((
    { id, dialog, showHidden, onFocus, onPathChanged, onItemsChanged, onCopy },
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
            createFolder,
            deleteItems,
            getController: () => controller.current,
            getItems: () => items,
            getSelectedItems
        }))

    const restrictionView = useRef<RestrictionViewHandle>(null)

    const virtualTable = useRef<VirtualTableHandle<FolderViewItem>>(null)
    const controller = useRef<Controller>(createEmptyController())
    const sortIndex = useRef(0)
    const sortDescending = useRef(false)
    const itemCount = useRef({ fileCount: 0, dirCount: 0 })

    const [items, setItems] = useState([] as FolderViewItem[])
    const [path, setPath] = useState("")
    const [dragStarted, setDragStarted] = useState(false)
    const [dragging, setDragging] = useState(false)

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
        let widthstr = localStorage.getItem(getWidthsId())
        let widths = widthstr ? JSON.parse(widthstr) as number[] : null
        return widths
            ? {
                ...columns, columns: columns.columns.map((n, i) => ({...n, width: widths![i]}))
            }
            : columns
    }

    const changePath = async (path: string, showHidden: boolean, latestPath?: string) => {
        restrictionView.current?.reset()
        const result = checkController(path, controller.current)
        if (result.changed) {
            controller.current = result.controller
            setItems([])
            virtualTable.current?.setColumns(setWidths(controller.current.getColumns()))
        }

        const items = await controller.current.getItems(path, showHidden, sortIndex.current, sortDescending.current)
        setPath(items.path)
        setItems(items.items)
        itemCount.current = { dirCount: items.dirCount, fileCount: items.fileCount }
        onItemsChanged(itemCount.current)
        localStorage.setItem(`${id}-lastPath`, items.path)
        const pos = latestPath ? items.items.findIndex(n => n.name == latestPath) : 0
        virtualTable.current?.setInitialPosition(pos, items.items.length)
        refPath.current = items.path
        const extendedInfoItems = await controller.current.getExtendedItems(items.path, items.items)
        if (extendedInfoItems.path == refPath.current) 
            setItems(controller.current.setExtendedItems(items.items, extendedInfoItems))    
    }

    const onEnter = async (item: FolderViewItem, keys: SpecialKeys) => {
        const result = await controller.current.onEnter({path, item, keys, dialog, refresh, selectedItems: getSelectedItems(), items})
        if (!result.processed && result.pathToSet) 
            changePath(result.pathToSet, showHidden, result.latestPath)
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
        (item: FolderViewItem, pos?: number) => onPathChanged(controller.current.appendPath(path, item.name), item.isDirectory == true),
        // HACK onPathChanged
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, path])         

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
                    setItems(items.map((n, i) => setSelection(n, i <= virtualTable.current?.getPosition()!)))
                controller.current.onSelectionChanged(items)
                evt.preventDefault()
                evt.stopPropagation()
                break
            case "End":
                if (controller.current.itemsSelectable) 
                    setItems(items.map((n, i) => setSelection(n, i >= virtualTable.current?.getPosition()!)))
                controller.current.onSelectionChanged(items)                    
                evt.preventDefault()
                evt.stopPropagation()
                break
            case "Space":
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
            case "Escape":
                if (controller.current.itemsSelectable) 
                    setItems(items.map((n) => setSelection(n, false)))
                controller.current.onSelectionChanged(items)                    
                break
            case "Delete":
                await deleteItems()
                break
            default:
                const restrictedItems = restrictionView.current?.checkKey(evt.key)
                if (restrictedItems) {
                    virtualTable.current?.setPosition(0)
                    setItems(restrictedItems)
                }
                break
        }
    }

    const onFocusChanged = useCallback(() => {
        onFocus()
        const pos = virtualTable.current?.getPosition() ?? 0
        const item = pos < items.length ? items[pos] : null 
        if (item)
            onPositionChanged(item)
        onItemsChanged(itemCount.current)
        // HACK onFocus, onPositionChanged
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]) 

    const refresh = async (forceShowHidden?: boolean) =>
        changePath(path, forceShowHidden == undefined ? showHidden : forceShowHidden)

    const rename = async () => {
        virtualTable.current?.setFocus()
        const items = getSelectedItems()
        if (items?.length == 1) {
            const result = await controller.current.rename(path, items[0], dialog)
            if (await checkResult(dialog, virtualTable.current, result))
               refresh() 
        }
    }

    const createFolder = async () => {
        virtualTable.current?.setFocus()
        const result = await controller.current.createFolder(path, items[virtualTable.current?.getPosition() ?? 0], dialog)
        if (await checkResult(dialog, virtualTable.current, result))
            refresh() 
    }

    const deleteItems = async () => {
        virtualTable.current?.setFocus()
        const items = getSelectedItems()
        if (items.length == 0)
            return
        const result = await controller.current.deleteItems(path, items, dialog)
        if (await checkResult(dialog, virtualTable.current, result))
            refresh() 
    }

    const onDragStart = (evt: React.DragEvent) => {
        if (getSelectedItems().length > 0) {
            evt.dataTransfer.setData("internalCopy", "true")
            setDragStarted(true)
        } else
            evt.preventDefault()
	}

    const onDragEnd = (evt: React.DragEvent) => setDragStarted(false)

    const dropTarget = useRef<HTMLElement|null>(null)
    
    const onDragEnter = (evt: React.DragEvent) => {
        // var WV_File = (window as any).chrome.webview.hostObjects.WV_File
        // WV_File.DragDropFile()
        if (!dragStarted) {
            setDragging(true)
            dropTarget.current = evt.nativeEvent.target as HTMLElement
        }
    }

    const onDragLeave = (evt: React.DragEvent) => {
        if (dropTarget.current == evt.nativeEvent.target as HTMLElement) {
            dropTarget.current = null
            setDragging(false)
        }
    }        

    const dropEffect = useRef<"move"|"copy"|"none">("none")

    const onDragOver = (evt: React.DragEvent) => {
        if (!dragStarted) {
            evt.dataTransfer.dropEffect = 
                evt.dataTransfer.effectAllowed == "move" 
                || evt.dataTransfer.effectAllowed == "copyMove"
                || evt.dataTransfer.effectAllowed == "linkMove"
                || evt.dataTransfer.effectAllowed == "all"
                ? "move" 
                : (evt.dataTransfer.effectAllowed == "copy" 
                || evt.dataTransfer.effectAllowed == "copyLink"
                ? "copy"
                : "none")
            if (evt.ctrlKey && evt.dataTransfer?.dropEffect == "move" && (evt.dataTransfer.effectAllowed == "copy" 
                || evt.dataTransfer.effectAllowed == "copyMove"
                || evt.dataTransfer.effectAllowed == "copyLink"
                || evt.dataTransfer.effectAllowed == "all"))
                evt.dataTransfer.dropEffect = "copy"
            dropEffect.current = evt.dataTransfer.dropEffect
            evt.preventDefault() // Necessary. Allows us to drop.
        }
    }

    const onDrop = (evt: React.DragEvent) => {
        setDragging(false)
        if (evt.dataTransfer.getData("internalCopy") == "true") {
            evt.preventDefault()
            onCopy(dropEffect.current == "move")
        } else {
            let onDrop = async () => {
                function *getItems() {
                    if (evt.dataTransfer?.files)
                        for (let i = 0; i < evt.dataTransfer.files.length; i++)
                            yield evt.dataTransfer!.files.item(i)!
                }
                let input = [...getItems()].map(n => (n as any).path)
                console.log("input", input, evt)
                // let copyFiles = await request<CopyFiles>("preparefilecopy", input)
                        
                // await copyItems(this.id, e => this.checkResult(e), false,
                //     this.id != "folderLeft",
                //     EngineType.Directory,
                //     this.engine,
                //     copyFiles.basePath,
                //     this.path,
                //     copyFiles.items
                // )
    
                // this.setFocus()
                // this.reloadItems()
            }               
            onDrop()   
        }
    }

    return (
        <div className={`folder${dragging ? " dragging": ""}`} onFocus={onFocusChanged} 
                onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
            <input className="pathInput" spellCheck={false} value={path} onChange={onInputChange} onKeyDown={onInputKeyDown} onFocus={onInputFocus} />
            <div className={`tableContainer${dragStarted ? " dragStarted" : ""}`} onKeyDown={onKeyDown} >
                <VirtualTable ref={virtualTable} items={items} onSort={onSort} onDragStart={onDragStart} onDragEnd={onDragEnd}
                    onColumnWidths={onColumnWidths} onEnter={onEnter} onPosition={onPositionChanged} />
            </div>
            <RestrictionView items={items} ref={restrictionView} />
        </div>
    )
})

export default FolderView

// TODO remote createFolder
// TODO Take RenderRow in column
// TODO remote delete files
// TODO remote rename file
// TODO remote move
// TODO Selection Ctrl+Mouse click
// TODO Error from getItems/tooltip from dialog-box-react
// TODO Statusbar nowrap text-overflow ellipses
// TODO Viewer: directory info
// TODO Check windows webview: drop file/files/folder/folders
// TODO https://github.com/MicrosoftEdge/WebView2Feedback/issues/2313
// TODO Check gtk webview: drop file/files/folder/folders sudo apt install libwebkit2gtk-4.0-dev
// TODO https://stackoverflow.com/questions/71581401/drag-a-file-from-my-gtk-app-to-another-app-not-the-other-way-around
