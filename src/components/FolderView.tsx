import { useEffect, useRef, useState } from 'react'
import './FolderView.css'
import VirtualTable, { createEmptyHandle, OnSort, TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { checkController, Controller, createEmptyController } from '../controller/controller'
import { ROOT } from '../controller/root'

const FolderView = () => {

    const virtualTable = useRef<VirtualTableHandle>(createEmptyHandle())
    
    const [items, setItems] = useState([] as TableRowItem[])
    const [path, setPath] = useState("")

    const controller = useRef<Controller>(createEmptyController())
    
    const onSort = (sort: OnSort) => console.log("onSort", sort)

    const onColumnWidths = (widths: number[]) => {
		if (widths.length == 4)
			localStorage.setItem("widths", JSON.stringify(widths))
	} 

    useEffect(() => virtualTable.current.setFocus(), [])

    useEffect(() => {
        changePath(ROOT)
    }, [setItems])

    const changePath = async (path: string) => {
        const result = checkController(path, controller.current)
        if (result.changed) {
            controller.current = result.controller
            virtualTable.current.setColumns(controller.current.getColumns())
        }

        const items = await controller.current.getItems(path)
        setPath(items.path)
        setItems(items.items)
    }
    
    return (
        <>
            <input className="pathInput" value={path} />
            <div className="tableContainer">
                <VirtualTable ref={virtualTable} items={items} onSort={onSort} onColumnWidths={onColumnWidths} />
            </div>
        </>
    )
}

export default FolderView

// TODO changing path with enter
// TODO isHidden, isMounted: setRowClass in table-view-react
// TODO sorting
// TODO SSE for theme detection?
// TODO exif and version
// TODO css themes windows windows dark, adwaita and adwaita dark
