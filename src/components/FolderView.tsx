import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import './FolderView.css'
import VirtualTable, { OnSort, SpecialKeys, TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { checkController, Controller, createEmptyController } from '../controller/controller'
import { ROOT } from '../controller/root'
import RestrictionView, { RestrictionViewHandle } from './RestrictionView'
import { IOError, Version } from '../controller/requests'
import { DialogHandle } from 'web-dialog-react'

export interface FolderViewItem extends TableRowItem {
    name: string
    size?: number
    isParent?: boolean
    isDirectory?: boolean
    // Root item
    description?: string
    mountPoint?: string
    isMounted?: boolean
    // FileSystem item
    iconPath?: string
    time?: string
    exifDate?: string
    version?: Version
    isHidden?: boolean
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
}

const FolderView = forwardRef<FolderViewHandle, FolderViewProp>((
    { id, dialog, showHidden, onFocus, onPathChanged, onItemsChanged },
    ref) => {

        useImperativeHandle(ref, () => ({
            id,
            setFocus() { virtualTable.current?.setFocus() },    
            refresh,
            selectAll() {
                if (controller.current.itemsSelectable) 
                    setItems(items.map((n) => setSelection(n, true)))
            },
            selectNone() {
                if (controller.current.itemsSelectable) 
                    setItems(items.map((n) => setSelection(n, false)))
            },
            changePath(path: string) {
                changePath(path, showHidden)
            },
            getPath() { return path },
            rename, 
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

    const onColumnWidths = (widths: number[]) => {
		if (widths.length == 4)
			localStorage.setItem("widths", JSON.stringify(widths))
	} 

    const refPath = useRef("")

    useEffect(() => virtualTable.current?.setFocus(), [])

    useEffect(() => {
        changePath(localStorage.getItem(`${id}-lastPath`) ?? ROOT, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const changePath = async (path: string, showHidden: boolean, latestPath?: string) => {
        restrictionView.current?.reset()
        const result = checkController(path, controller.current)
        if (result.changed) {
            controller.current = result.controller
            virtualTable.current?.setColumns(controller.current.getColumns())
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
            setItems(controller.current.setExtendedItems(items.items, extendedInfoItems.extendedItems))    
    }

    const onEnter = (item: FolderViewItem, keys: SpecialKeys) => {
        const result = controller.current.onEnter(path, item, keys)
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
        if (!item.isParent)
            item.isSelected = !item.isSelected
        return item
    }
        
    const setSelection = (item: FolderViewItem, set: boolean) => {
        if (!item.isParent)
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
                    evt.preventDefault()
                    evt.stopPropagation()
                }
                break
            case "Home":
                if (controller.current.itemsSelectable) 
                    setItems(items.map((n, i) => setSelection(n, i <= virtualTable.current?.getPosition()!)))
                evt.preventDefault()
                evt.stopPropagation()
                break
            case "End":
                if (controller.current.itemsSelectable) 
                    setItems(items.map((n, i) => setSelection(n, i >= virtualTable.current?.getPosition()!)))
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
                evt.preventDefault()
                evt.stopPropagation()
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
            if (await checkResult(result))
               refresh() 
        }
    }

    const createFolder = async () => {
        virtualTable.current?.setFocus()
        const result = await controller.current.createFolder(path, items[virtualTable.current?.getPosition() ?? 0], dialog)
        if (await checkResult(result))
            refresh() 
    }

    const deleteItems = async () => {
        virtualTable.current?.setFocus()
        const items = getSelectedItems()
        if (items.length == 0)
            return
        const result = await controller.current.deleteItems(path, items, dialog)
        if (await checkResult(result))
            refresh() 
    }

    const checkResult = async (error: IOError | null) => {
        if (error) {
            const text = error.Case == "AccessDenied" 
                        ? "Zugriff verweigert"
                        : error.Case == "DeleteToTrashNotPossible"
                        ? "Löschen nicht möglich"
                        : error.Case == "AlreadyExists"
                        ? "Das Element existiert bereits"
                        : error.Case == "FileNotFound"
                        ? "Das Element ist nicht vorhanden"
                        : "Die Aktion konnte nicht ausgeführt werden"
            await dialog?.show({
                text,
                btnOk: true
            })
            virtualTable.current?.setFocus()
            return false
        } else
            return true
    }

    const onDragStart = (evt: React.DragEvent) => {
        if (getSelectedItems().length > 0) {
            evt.dataTransfer.setData("internalCopy", "true")
            setDragStarted(true)
        } else
            evt.preventDefault()
            
	}

    const onDragEnd = (evt: React.DragEvent) => setDragStarted(false)
        
    return (
        <div className='folder' onFocus={onFocusChanged}>
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

// TODO copy/move 
// TODO drag'n'drop
// TODO Check windows webview: drop file/files/folder/folders
// TODO Check gtk webview: drop file/files/folder/folders sudo apt install libwebkit2gtk-4.0-dev
// TODO Check qt webview: drag'n'drop, mp4, pdf
// TODO remotes
// TODO extended rename
// TODO Admin mode Windows
// TODO asve/restore column widths
// TODO Shortcuts not preventing default: Strg+R activates restriction
// TODO Selection Ctrl+Mouse click
// TODO Error from getItems/tooltip from dialog-box-react
// TODO Strg+H not working in menubar
// TODO Viewer: PDf
// TODO Statusbar nowrap text-overflow ellipses
// TODO Viewer: directory info