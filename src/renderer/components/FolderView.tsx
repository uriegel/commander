import { forwardRef, useCallback, useEffect, useRef, useState } from "react"
import VirtualTable, { type OnSort, type SelectableItem, type TableColumns, type VirtualTableHandle } from "virtual-table-react"
import './FolderView.css'
import { getItemsProvider } from "../items-provider/provider"
import { Item } from "../items-provider/items"
import { IItemsProvider } from "../items-provider/base-provider"

export type FolderViewHandle = {
    id: string
    setFocus: ()=>void
    refresh: (forceShowHidden?: boolean) => void
    getPath: () => string
    changePath: (path: string) => void
    insertSelection: () => void
    selectAll: () => void
    selectNone: () => void
}

interface FolderViewProp {
    id: string,
    showHidden: boolean
    onFocus: () => void
    onItemChanged: (path: string, isDir: boolean, latitude?: number, longitude?: number) => void
    // onItemsChanged: (count: ItemCount)=>void
    onEnter: (item: Item)=>void
    setStatusText: (text?: string) => void
    //dialog: DialogHandle
}

const FolderView = forwardRef<FolderViewHandle, FolderViewProp>((
    { id, showHidden, onFocus, onEnter, onItemChanged, setStatusText },
    ref) => {
    
    const input = useRef<HTMLInputElement | null>(null)

    const virtualTable = useRef<VirtualTableHandle<Item>>(null)

    const [items, setStateItems] = useState([] as Item[])
    const [path, setPath] = useState("")

    const itemsProvider = useRef<IItemsProvider>(undefined)

    useEffect(() => {
        changePath(localStorage.getItem(`${id}-lastPath`) ?? "root", false, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps        
    }, []) 

    const changePath = useCallback(async (path?: string, forceShowHidden?: boolean, mount?: boolean, latestPath?: string, fromBacklog?: boolean, checkPosition?: (checkItem: Item) => boolean) => {
        const newItemsProvider = getItemsProvider(path, itemsProvider.current)
        const result = await newItemsProvider.getItems(id, path, forceShowHidden === undefined ? showHidden : forceShowHidden, mount)
        console.log("items", result)
        if (result.cancelled)
            return
        // restrictionView.current?.reset()
        if (itemsProvider.current != newItemsProvider) {
            itemsProvider.current = newItemsProvider
            virtualTable.current?.setColumns(setWidths(itemsProvider.current.getColumns()))
        }
        // if (result.path)
        //     setPath(result.path)
        //const items = result.items && result.items?.length > 0 ? result.items : itemsProvider.current.getItems()
        // const newItems = controller.current.sort(items, sortIndex.current, sortDescending.current)
        setItems(result.items!, result.dirCount, result.fileCount)
        // getExtended({ id: result.id, folderId: id })
        // const pos = latestPath
        //             ? newItems.findIndex(n => n.name == latestPath)
        //             : checkPosition
        //             ? newItems.findIndex(n => checkPosition(n))
        //             : 0
        // virtualTable.current?.setInitialPosition(pos, newItems.length)
        // if (result.path) {
        //     localStorage.setItem(`${id}-lastPath`, result.path)
        //     if (!fromBacklog)
        //         history.current.set(result.path)
        // }
        //    }, [id, setItems, setWidths, showHidden])
    }, [id, showHidden])

    
    // const onSort = async (sort: OnSort) => {
    //     sortIndex.current = sort.isSubColumn ? 10 : sort.column
    //     sortDescending.current = sort.isDescending
    //     const newItems = controller.current.sort(items, sortIndex.current, sortDescending.current)
    //     setItems(newItems)
    //     const name = items[virtualTable.current?.getPosition() ?? 0].name
    //     virtualTable.current?.setPosition(newItems.findIndex(n => n.name == name))
    // }
    const onSort = (sort: OnSort) => {
    }

    // const onPositionChanged = useCallback((item: FolderViewItem) =>
    //     onItemChanged(controller.current.appendPath(path, item.name),
    //         item.isDirectory == true, item.exifData?.latitude, item.exifData?.longitude),
    // [path, onItemChanged])         
    const onPositionChanged = useCallback((item: Item) => {}, [path])         
    
    // const setItems = useCallback((items: Item[], dirCount?: number, fileCount?: number) => {
    //     setStateItems(items)
    //     refItems.current = items
    //     if (dirCount != undefined || fileCount != undefined) {
    //         itemCount.current = { dirCount: dirCount || 0, fileCount: fileCount || 0 }
    //         onItemsChanged(itemCount.current)
    //     }
    // }, [onItemsChanged])
    const setItems = useCallback((items: Item[], dirCount?: number, fileCount?: number) => {
        setStateItems(items)
        //refItems.current = items
    }, [])
    

    const getWidthsId = useCallback(() => `${id}-${itemsProvider.current?.id}-widths`, [id])

    const setWidths = useCallback((columns: TableColumns<Item>) => {
        const widthstr = localStorage.getItem(getWidthsId())
        const widths = widthstr ? JSON.parse(widthstr) as number[] : null
        return widths
            ? {
                ...columns, columns: columns.columns.map((n, i) => ({...n, width: widths![i]}))
            }
            : columns
    }, [getWidthsId])

    const onFocusChanged = useCallback(() => {
        onFocus()
        // const pos = virtualTable.current?.getPosition() ?? 0
        // const item = pos < items.length ? items[pos] : null
        // if (item)
        //     onPositionChanged(item)
        // onItemsChanged(itemCount.current)
        //    }, [items, onFocus, onPositionChanged, onItemsChanged]) 
    }, [])

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPath(e.target.value)

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.code == "Enter") {
//            changePath(path, showHidden)
            virtualTable.current?.setFocus()
            e.stopPropagation()
            e.preventDefault()
        }
    }

    const onKeyDown = async (evt: React.KeyboardEvent) => {
        switch (evt.code) {
        }
    }

    const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) => 
        setTimeout(() => e.target.select())

    const onColumnWidths = (widths: number[]) => {
        if (widths.length)
            localStorage.setItem(getWidthsId(), JSON.stringify(widths))
    }

    return (
        <div className="folder" onFocus={onFocusChanged}>
            <input ref={input} className="pathInput" spellCheck={false} value={path} onChange={onInputChange} onKeyDown={onInputKeyDown} onFocus={onInputFocus} />
            <div className="tableContainer" onKeyDown={onKeyDown} >
                <VirtualTable ref={virtualTable} items={items} onColumnWidths={onColumnWidths} onEnter={onEnter} onPosition={onPositionChanged} onSort={onSort} />
            </div>
            {/* <RestrictionView items={items} ref={restrictionView} /> */}
        </div>
    )
})

export default FolderView
