import React, { useEffect, useRef, useState } from 'react'
import VirtualTable, { createEmptyHandle, OnSort, TableRowItem, VirtualTableHandle } from 'virtual-table-react'

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
				{ name: "Details", isRightAligned: true }
			],
			renderRow: ({ index }: TableRowItem) => [
				`Der ${index}. Eintrag`,
				`Datum ${index}`,
				`Der ${index}. Eintrag in der 3. Spalte`
			],
			measureRow: () => `Measure`
		})

		const items = [...Array(20).keys()].map(n => ({index: n})) as TableRowItem[]
		setItems(items)
    }, [setItems])
    
    return (
        <div className="tableContainer">
            <VirtualTable ref={virtualTable} items={items} onSort={onSort} onColumnWidths={onColumnWidths} />
        </div>
    )
}

export default FolderView

// TODO System windows or linux in location
// TODO css themes windows windows dark, adwaita and adwaita dark