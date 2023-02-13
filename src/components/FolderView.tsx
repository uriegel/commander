import { useEffect, useRef, useState } from 'react'
import VirtualTable, { createEmptyHandle, OnSort, TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { checkController, Controller, createEmptyController, makeTableViewItems } from '../controller/controller'
import { ROOT } from '../controller/root'

const FolderView = () => {

    const virtualTable = useRef<VirtualTableHandle>(createEmptyHandle())
    
    const [items, setItems] = useState([] as TableRowItem[])

    const controller = useRef<Controller>(createEmptyController())
    const currentPath = useRef<string>(ROOT)

    const onSort = (sort: OnSort) => console.log("onSort", sort)

    const onColumnWidths = (widths: number[]) => {
		if (widths.length == 4)
			localStorage.setItem("widths", JSON.stringify(widths))
	} 

    useEffect(() => {
        changePath(currentPath.current)
    }, [setItems])

    const changePath = async (path: string) => {
        const result = checkController(currentPath.current, controller.current)
        if (result.changed) {
            controller.current = result.controller
            virtualTable.current.setColumns(controller.current.getColumns())
        }

        const items = await controller.current.getItems(currentPath.current)
        setItems(makeTableViewItems(items))
    }
    
    return (
        <div className="tableContainer">
            <VirtualTable ref={virtualTable} items={items} onSort={onSort} onColumnWidths={onColumnWidths} />
        </div>
    )
}

export default FolderView

// TODO sorting
// TODO changing path with enter
// TODO System windows or linux in location
// TODO SSE for theme detection?
// TODO exif and version
// TODO css themes windows windows dark, adwaita and adwaita dark
