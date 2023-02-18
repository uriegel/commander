import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import './FolderView.css'
import VirtualTable, { createEmptyHandle, OnSort, SpecialKeys, TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { checkController, Controller, createEmptyController } from '../controller/controller'
import { ROOT } from '../controller/root'
import { FolderItem } from '../controller/requests'
import RestrictionView, { RestrictionViewHandle } from './RestrictionView'

export type FolderViewHandle = {
    setFocus: ()=>void
    refresh: (forceShowHidden?: boolean)=>void
}

export const createEmptyFolderHandle = () => ({
    setFocus: () => { },
    refresh: () => {}
})

interface FolderViewProp {
    showHidden: boolean
}

const FolderView = forwardRef<FolderViewHandle, FolderViewProp>((
    { showHidden }, ref) => {

    useImperativeHandle(ref, () => ({
        setFocus() { virtualTable.current.setFocus() },
        refresh(forceShowHidden?: boolean) { changePath(path, forceShowHidden == undefined ? showHidden : forceShowHidden) }
    }))

    const restrictionView = useRef<RestrictionViewHandle>(null)

    const virtualTable = useRef<VirtualTableHandle>(createEmptyHandle())
    const controller = useRef<Controller>(createEmptyController())
    const sortIndex = useRef(0)
    const sortDescending = useRef(false)

    const [items, setItems] = useState([] as TableRowItem[])
    const [path, setPath] = useState("")
    
    const onSort = async (sort: OnSort) => {
        sortIndex.current = sort.column
        sortDescending.current = sort.isDescending
        const newItems = controller.current.sort(items, sort.isSubColumn ? 10 : sortIndex.current, sortDescending.current)
        setItems(newItems)
        const name = (items[virtualTable.current.getPosition()] as FolderItem).name
        virtualTable.current.setPosition(newItems.findIndex(n => (n as FolderItem).name == name))
    }

    const onColumnWidths = (widths: number[]) => {
		if (widths.length == 4)
			localStorage.setItem("widths", JSON.stringify(widths))
	} 

    const refPath = useRef("")

    useEffect(() => virtualTable.current.setFocus(), [])

    useEffect(() => {
        changePath(ROOT, false)
    }, [setItems])

    const changePath = async (path: string, showHidden: boolean, latestPath?: string) => {
        restrictionView.current?.reset()
        const result = checkController(path, controller.current)
        if (result.changed) {
            controller.current = result.controller
            virtualTable.current.setColumns(controller.current.getColumns())
        }

        const items = await controller.current.getItems(path, showHidden, sortIndex.current, sortDescending.current)
        setPath(items.path)
        setItems(items.items)
        const pos = latestPath ? items.items.findIndex(n => (n as any).name == latestPath) : 0
        virtualTable.current.setInitialPosition(pos, items.items.length)
        refPath.current = items.path
        const extendedInfoItems = await controller.current.getExtendedItems(items.path, items.items)
        if (extendedInfoItems.path == refPath.current) 
            setItems(controller.current.setExtendedItems(items.items, extendedInfoItems.extendedItems))    
    }

    const onEnter = (item: TableRowItem, keys: SpecialKeys) => {
        const result = controller.current.onEnter(path, item, keys)
        if (!result.processed && result.pathToSet) 
            changePath(result.pathToSet, showHidden, result.latestPath)
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>  {
        console.log("e", e)
        setPath(e.target.value)
    }

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.code == "Enter") {
            changePath(path, showHidden)
            virtualTable.current.setFocus()
            e.stopPropagation()
            e.preventDefault()
        }
    }

    const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) => 
        setTimeout(() => e.target.select())
    
    const onKeyDown = (evt: React.KeyboardEvent) => {
        const restrictedItems = restrictionView.current?.checkKey(evt.key)
        if (restrictedItems) {
            virtualTable.current.setPosition(0)            
            setItems(restrictedItems)
        }
        
    }
        
    return (
        <>
            <input className="pathInput" value={path} onChange={onInputChange} onKeyDown={onInputKeyDown} onFocus={onInputFocus} />
            <div className="tableContainer" onKeyDown={onKeyDown}>
                <VirtualTable ref={virtualTable} items={items} onSort={onSort}
                    onColumnWidths={onColumnWidths} onEnter={onEnter} />
            </div>
            <RestrictionView items={items} ref={restrictionView} />
        </>
    )
})

export default FolderView

// TODO Selection (with restriction)
// TODO Splitter, two folderviews
// TODO Statusbar
// TODO Viewer
// TODO Error from getItems/tooltip from dialog-box-react
// TODO SSE for theme detection?
// TODO css themes windows windows dark, adwaita and adwaita dark
// TODO Strg+H not working in menubar
