import React, { useEffect, useRef, useState } from 'react'
import VirtualTable, { createEmptyHandle, OnSort, TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { makeTableViewItems } from '../controller/controller'
import { getItems } from '../controller/filesystem'
import { FolderItem } from '../controller/requests'

const FolderView = () => {

    const virtualTable = useRef<VirtualTableHandle>(createEmptyHandle())
    
    const [items, setItems] = useState([] as TableRowItem[])

    const onSort = (sort: OnSort) => console.log("onSort", sort)

    const onColumnWidths = (widths: number[]) => {
		if (widths.length == 4)
			localStorage.setItem("widths", JSON.stringify(widths))
	} 



    useEffect(() => {
		virtualTable.current.setColumns({
			columns: [
				{ name: "Name", isSortable: true, subColumn: "Ext." },
				{ name: "Date" },
				{ name: "Größe", isRightAligned: true }
			],
            renderRow: (props: TableRowItem) => {
                var items = props as FolderItem
                return [
                    items.name,
                    `Datum ${items.index}`,
                    `Der ${items.index}. Eintrag in der 3. Spalte`
                ]
            },
			measureRow: () => `Measure`
        })
        
        const startGetItems = async () => {
            const items = await getItems("/media/uwe/Home/Bilder/Fotos/2022/Uwes Handy")
            setItems(makeTableViewItems(items.items))
        }
        startGetItems()

    }, [setItems])
    
    return (
        <div className="tableContainer">
            <VirtualTable ref={virtualTable} items={items} onSort={onSort} onColumnWidths={onColumnWidths} />
        </div>
    )
}

export default FolderView

// TODO checkController with path / => FileSystemController
// TODO when changed: setColumns (from controller)
// TODO render rows in controller
// TODO sorting when subColumn: no hovering
// TODO System windows or linux in location
// TODO css themes windows windows dark, adwaita and adwaita dark