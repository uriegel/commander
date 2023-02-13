import { useEffect, useRef, useState } from 'react'
import './FolderView.css'
import VirtualTable, { createEmptyHandle, OnSort, TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { checkController, Controller, createEmptyController, makeTableViewItems } from '../controller/controller'
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
        // TODO path from F#
        setPath(path)
        setItems(makeTableViewItems(items))
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

// TODO sorting
// TODO changing path with enter
// TODO System windows or linux in location
// TODO SSE for theme detection?
// TODO exif and version
// TODO css themes windows windows dark, adwaita and adwaita dark
