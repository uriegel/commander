import { forwardRef, useCallback, useRef, useState } from "react"
import VirtualTable, { type OnSort, type SelectableItem, type TableColumns, type VirtualTableHandle } from "virtual-table-react"
import './FolderView.css'

// TODO discriminated union, share with main process, SelectableItem is empty there
// inherit from FolderViewItemBase
export interface FolderViewItem extends SelectableItem {
}
    
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
    onEnter: (item: FolderViewItem)=>void
    setStatusText: (text?: string) => void
    //dialog: DialogHandle
}

const FolderView = forwardRef<FolderViewHandle, FolderViewProp>((
    { id, showHidden, onFocus, onEnter, onItemChanged, setStatusText },
    ref) => {
    
    const input = useRef<HTMLInputElement | null>(null)

    const virtualTable = useRef<VirtualTableHandle<FolderViewItem>>(null)

    const [items, setStateItems] = useState([] as FolderViewItem[])
    const [path, setPath] = useState("")
    
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
    const onPositionChanged = useCallback((item: FolderViewItem) => {},
    [path])         

    // TODO controller id
    const getWidthsId = useCallback(() => `${id}-{controller.current.id}-widths`, [id])

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
