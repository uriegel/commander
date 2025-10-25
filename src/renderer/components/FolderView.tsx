import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import VirtualTable, { type OnSort, type TableColumns, type VirtualTableHandle } from "virtual-table-react"
import './FolderView.css'
import { getItemsProvider } from "../items-provider/provider"
import { Item, FileItem, RemotesItem } from "../items-provider/items"
import { IItemsProvider } from "../items-provider/base-provider"
import { DialogHandle } from "web-dialog-react"
import { initializeHistory } from "../history"
import RestrictionView, { RestrictionViewHandle } from "./RestrictionView"
import { ID_LEFT } from "./Commander"
import { exifDataEventsLeft$, exifDataEventsRight$, ExifDataType, exifStartEventsLeft$, exifStartEventsRight$, exifStopEventsLeft$, exifStopEventsRight$ } from "../requests/events"
import { SystemError } from "filesystem-utilities"
import { cancelExifs, onEnter as reqOnEnter } from "../requests/requests"

export type FolderViewHandle = {
    id: string
    setFocus: () => void
    refresh: (forceShowHidden?: boolean) => Promise<void>
    processEnter: (item: Item, otherPath?: string) => Promise<void>
    getPath: () => string
    changePath: (path: string) => void
    insertSelection: () => void
    selectAll: () => void
    selectNone: () => void
    showProperties: () => void
    openWith: () => void
    getSelectedItems: () => Item[]
    getCurrentItemsProvider: () => IItemsProvider|undefined
    getAppendPath: () => ((path: string, subPath: string) => string) | undefined
    deleteItems: () => void
    renameItem: (asCopy?: boolean) => void
    createFolder: () => void
    getItems: () => Item[]
}

export interface ItemCount {
    fileCount: number
    dirCount: number
}

interface FolderViewProp {
    id: string,
    showHidden: boolean
    onFocus: () => void
    onItemChanged: (id: string, path: string, isDir: boolean, latitude?: number, longitude?: number) => void
    onItemsChanged: (id: string, count: ItemCount) => void
    onEnter: (item: Item) => void
    setStatusText: (text?: string) => void
    setErrorText: (text?: string) => void
    dialog: DialogHandle
}

const FolderView = forwardRef<FolderViewHandle, FolderViewProp>((
    { id, showHidden, onFocus, onEnter, onItemChanged, onItemsChanged, dialog, setErrorText, setStatusText },
    ref) => {

    const input = useRef<HTMLInputElement | null>(null)

    const virtualTable = useRef<VirtualTableHandle<Item>>(null)
    const itemCount = useRef({ fileCount: 0, dirCount: 0 })
    const restrictionView = useRef<RestrictionViewHandle>(null)
    const requestId = useRef(0)
    const itemsDictionary = useRef<Map<number, Item>>(new Map)
    const itemsRef = useRef<Item[]>([])

    const [items, setStateItems] = useState([] as Item[])
    const [path, setPath] = useState("")

    const itemsProvider = useRef<IItemsProvider>(undefined)
    const sortIndex = useRef(0)
    const sortDescending = useRef(false)
    const history = useRef(initializeHistory())
    const refItems = useRef<Item[]>([]) 

    useImperativeHandle(ref, () => ({
        id,
        setFocus() { virtualTable.current?.setFocus() },
        processEnter,
        refresh,
        getPath() { return path },
        changePath,
        insertSelection,
        selectAll,
        selectNone,
        openWith,
        showProperties,
        getSelectedItems,
        getCurrentItemsProvider,
        getAppendPath,
        deleteItems,
        createFolder,
        renameItem,
        getItems,
        // openFolder,
        // extendedRename,
        // showFavorites
    }))

    useEffect(() => {
        changePath(localStorage.getItem(`${id}-lastPath`) ?? "root", false, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps        
    }, [])

    const setItems = useCallback((items: Item[], dirCount?: number, fileCount?: number) => {
        setStateItems(items)
        refItems.current = items
        if (dirCount != undefined || fileCount != undefined) {
            itemCount.current = { dirCount: dirCount || 0, fileCount: fileCount || 0 }
            onItemsChanged(id, itemCount.current)
        }
    }, [id, onItemsChanged])

    useEffect(() => {
        const attachExifs = (exif: ExifDataType) => {
            if (exif.requestId != requestId.current)
                return
            exif.items.forEach(n => {
                const item = itemsDictionary.current.get(n.idx) as FileItem
                if (item) {
                    item.exifData = {
                        dateTime: n.dateTime,
                        longitude: n.longitude,
                        latitude: n.latitude
                    }
                }
            })
            const newItems = itemsProvider.current?.sort(refItems.current, sortIndex.current, sortDescending.current)
            if (newItems)
                setItems(newItems)
        }

        const event$ = id == ID_LEFT ? exifDataEventsLeft$ : exifDataEventsRight$
        const sub = event$.subscribe(attachExifs)
        return () => sub.unsubscribe()
    }, [id, setItems])

    useEffect(() => {
        const event$ = id == ID_LEFT ? exifStartEventsLeft$ : exifStartEventsRight$
        const sub = event$.subscribe(() => setStatusText("Ermittle EXIF-Informationen..."))
        return () => sub.unsubscribe()
    }, [id, setStatusText])

    useEffect(() => {
        const event$ = id == ID_LEFT ? exifStopEventsLeft$ : exifStopEventsRight$
        const sub = event$.subscribe(() => setStatusText())
        return () => sub.unsubscribe()
    }, [id, setStatusText])

    const onSort = async (sort: OnSort) => {
        sortIndex.current = sort.isSubColumn ? 10 : sort.column
        sortDescending.current = sort.isDescending
        const newItems = itemsProvider.current?.sort(items, sortIndex.current, sortDescending.current)
        if (newItems) {
            setItems(newItems)
            const name = items[virtualTable.current?.getPosition() ?? 0].name
            virtualTable.current?.setPosition(newItems.findIndex(n => n.name == name))
        }
    }

    const getItems = () => itemsRef.current

    const onPositionChanged = useCallback((item: Item) =>
        onItemChanged(id, itemsProvider.current?.appendPath(path, item.name) || "",
            item.isDirectory == true, (item as FileItem)?.exifData?.latitude, (item as FileItem)?.exifData?.longitude),
        [id, path, onItemChanged])

    const getWidthsId = useCallback(() => `${id}-${itemsProvider.current?.id}-widths`, [id])

    const setWidths = useCallback((columns: TableColumns<Item>) => {
        const widthstr = localStorage.getItem(getWidthsId())
        const widths = widthstr ? JSON.parse(widthstr) as number[] : null
        return widths
            ? {
                ...columns, columns: columns.columns.map((n, i) => ({ ...n, width: widths![i] }))
            }
            : columns
    }, [getWidthsId])

    const changePath = useCallback(async (path?: string, forceShowHidden?: boolean, mount?: boolean, latestPath?: string, fromBacklog?: boolean,
        checkPosition?: (checkItem: Item) => boolean) => {
        try {
            cancelExifs(`${id}-${requestId.current}`)
            requestId.current = getRequestId()
            const newItemsProvider = getItemsProvider(path, itemsProvider.current)
            const result = await newItemsProvider.getItems(id, requestId.current, path, forceShowHidden === undefined ? showHidden : forceShowHidden, mount)
            if (result.cancelled || !result.items || result.requestId != requestId.current)
                return
            restrictionView.current?.reset()
            if (itemsProvider.current != newItemsProvider) {
                itemsProvider.current = newItemsProvider
                virtualTable.current?.setColumns(setWidths(itemsProvider.current.getColumns()))
            }
            if (result.path)
                setPath(result.path)
            //const items = result.items && result.items?.length > 0 ? result.items : itemsProvider.current.getItems()
            itemsRef.current = itemsProvider.current.sort(result.items, sortIndex.current, sortDescending.current)
            setItems(itemsRef.current, result.dirCount, result.fileCount)
            itemsDictionary.current = new Map(itemsRef.current.filter(n => n.idx).map(n => [n.idx!, n]))
            // getExtended({ id: result.id, folderId: id })
            const pos = latestPath
                ? itemsRef.current.findIndex(n => n.name == latestPath)
                : checkPosition
                    ? itemsRef.current.findIndex(n => checkPosition(n))
                    : 0
            virtualTable.current?.setInitialPosition(pos, itemsRef.current.length)
            if (result.path) {
                localStorage.setItem(`${id}-lastPath`, result.path)
                if (!fromBacklog)
                    history.current.set(result.path)
            }
        } catch (e) {
            const err = e as SystemError
            setErrorText(err.message)
        }

    }, [id, setItems, setWidths, setErrorText, showHidden])

    const toggleSelection = (item: Item) => {
        if (!item.isParent && !(item as RemotesItem)?.isNew)
            item.isSelected = !item.isSelected
        return item
    }

    const setSelection = (item: Item, set: boolean) => {
        if (!item.isParent && !(item as RemotesItem)?.isNew)
            item.isSelected = set
        return item
    }

    const onFocusChanged = useCallback(() => {
        onFocus()
        const pos = virtualTable.current?.getPosition() ?? 0
        const item = pos < items.length ? items[pos] : null
        if (item)
            onPositionChanged(item)
        onItemsChanged(id, itemCount.current)
    }, [id, items, onFocus, onPositionChanged, onItemsChanged])

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.code == "Enter") {
            changePath(path, showHidden)
            virtualTable.current?.setFocus()
            e.stopPropagation()
            e.preventDefault()
        }
    }

    const onKeyDown = async (evt: React.KeyboardEvent) => {
        switch (evt.code) {
            case "Home":
                if (evt.shiftKey && itemsProvider.current?.itemsSelectable) {
                    setItems(items.map((n, i) => setSelection(n, i <= (virtualTable.current?.getPosition() ?? 0))))
                    evt.preventDefault()
                    evt.stopPropagation()
                }
                break
            case "End":
                if (evt.shiftKey && itemsProvider.current?.itemsSelectable) {
                    setItems(items.map((n, i) => setSelection(n, i >= (virtualTable.current?.getPosition() ?? 0))))
                    evt.preventDefault()
                    evt.stopPropagation()
                }
                break            
            case "Space": {
                const ri = restrictionView.current?.checkKey(" ")
                if (ri) {
                    virtualTable.current?.setPosition(0)
                    setItems(ri)
                } else if (itemsProvider.current?.itemsSelectable)
                    setItems(items.map((n, i) => i != virtualTable.current?.getPosition() ? n : toggleSelection(n)))
                itemsProvider.current?.onSelectionChanged(items)
                evt.preventDefault()
                evt.stopPropagation()
                break
            }
            case "Backspace":
                if (!checkRestricted(evt.key)) {
                    const path = history.current?.get(evt.shiftKey)
                    if (path)
                        changePath(path, showHidden, undefined, undefined, true)
                }
                break
            case "Escape":
                if (!checkRestricted(evt.key)) {
                    if (itemsProvider.current?.itemsSelectable)
                        setItems(items.map((n) => setSelection(n, false)))
                    itemsProvider.current?.onSelectionChanged(items)
                }
                break
            case "Delete":
                deleteItems()
                break
            default:
                checkRestricted(evt.key)
                break
        }
    }

    const getCurrentItemsProvider = () => itemsProvider.current

    const processEnter = async (item: Item, otherPath?: string) => {
        const res = await itemsProvider.current?.onEnter({ id, path, item, selectedItems: getSelectedItems(), dialog, otherPath })
        if (res && !res.processed)
            changePath(res.pathToSet, showHidden, res.mount, res.latestPath)
        if (res?.refresh)
            refresh()
    }

    const refresh = async (forceShowHidden?: boolean, checkPosition?: (checkItem: Item) => boolean) => {
        let selectedItems = getSelectedItems()
        if (selectedItems.length == 1 && !selectedItems[0].isSelected)
            selectedItems = []
        const pos = virtualTable.current?.getPosition()
        const currentItem = pos ? itemsRef.current[pos] : null
        await changePath(path, forceShowHidden || (forceShowHidden === false ? false : showHidden), undefined, undefined, undefined, checkPosition)
        const itemsNameDictionary = new Map(itemsRef.current.map(n => [n.name, n]))
        selectedItems.forEach(n => {
            const item = itemsNameDictionary.get(n.name)
            if (item) 
                item.isSelected = true
        })
        const idx = !checkPosition ? itemsRef.current.findIndex(n => n.name == currentItem?.name) : -1
        if (idx != -1)
            virtualTable.current?.setInitialPosition(idx, itemsRef.current.length)
    }

    const deleteItems = async () => {
        try {
            if (await getCurrentItemsProvider()?.deleteItems(path, getSelectedItems(), dialog))
                refresh()
        } catch (e) {
            const err = e as SystemError
            setErrorText(err.message)
        }
    }

    const renameItem = async (asCopy?: boolean) => {
        try {
            const selected = items[virtualTable.current?.getPosition() ?? 0]
            if (selected.isParent || asCopy && selected.isDirectory)
                return            
            const res = await getCurrentItemsProvider()?.renameItem(path, selected, dialog, asCopy)
            if (res)
                refresh(false, n => n.name == res)
        } catch (e) {
            const err = e as SystemError
            setErrorText(err.message)
        }
    }

    const createFolder = async () => {
        try {
            const selected = items[virtualTable.current?.getPosition() ?? 0]
            const res = await getCurrentItemsProvider()?.createFolder(path, selected, dialog)
            if (res)
                refresh(false, n => n.name == res)
        } catch (e) {
            const err = e as SystemError
            setErrorText(err.message)
        }
    }

    const getSelectedItems = () => {

        const checkParent = (item: Item) => !item.isParent ? item : null

        const selected = items.filter(n => n.isSelected)
        return selected.length > 0
            ? selected
            : [checkParent(items[virtualTable.current?.getPosition() ?? 0])].filter(n => n != null) as Item[]
    }

    const getAppendPath = () => itemsProvider.current?.appendPath

    const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) =>
        setTimeout(() => e.target.select())

    const onColumnWidths = (widths: number[]) => {
        if (widths.length)
            localStorage.setItem(getWidthsId(), JSON.stringify(widths))
    }

    const insertSelection = () => {
        if (itemsProvider.current?.itemsSelectable) {
            setItems(items.map((n, i) => i != virtualTable.current?.getPosition() ? n : toggleSelection(n)))
            virtualTable.current?.setPosition(virtualTable.current.getPosition() + 1)
            itemsProvider.current.onSelectionChanged(items)
        }
    }

    const selectAll = () => {
        if (itemsProvider.current?.itemsSelectable) {
            setItems(items.map((n) => setSelection(n, true)))
            itemsProvider.current.onSelectionChanged(items)
        }
    }

    const selectNone = () => {
        if (itemsProvider.current?.itemsSelectable) {
            setItems(items.map((n) => setSelection(n, false)))
            itemsProvider.current.onSelectionChanged(items)
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

    const showProperties = () => reqOnEnter(getSelectedItems()[0].name, path, undefined, true)
    const openWith = () => reqOnEnter(getSelectedItems()[0].name, path, true)

    return (
        <div className="folder" onFocus={onFocusChanged}>
            <input ref={input} className="pathInput" spellCheck={false} value={path} onChange={onInputChange} onKeyDown={onInputKeyDown} onFocus={onInputFocus} />
            <div className="tableContainer" onKeyDown={onKeyDown} >
                <VirtualTable ref={virtualTable} items={items} onColumnWidths={onColumnWidths} onEnter={onEnter} onPosition={onPositionChanged} onSort={onSort} />
            </div>
            <RestrictionView items={items} ref={restrictionView} />
        </div>
    )
})

let requestIdSeed = 0
const getRequestId = () => ++requestIdSeed

export default FolderView
