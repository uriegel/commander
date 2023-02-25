import { useEffect, useRef, useState } from 'react'
import VirtualTable, { TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { ExtensionProps } from 'web-dialog-react'

interface ConflictItem extends TableRowItem {
	name: string
}


const Conflicts = ({ props }: ExtensionProps) => {

    const virtualTable = useRef<VirtualTableHandle<ConflictItem>>(null)

    const [items, setItems] = useState([] as ConflictItem[])

    useEffect(() => {
		virtualTable.current?.setColumns({
			columns: [
				{ name: "Name", isSortable: true, subColumn: "Ext." },
				{ name: "Date" },
				{ name: "Details", isRightAligned: true }
			],
			renderRow: ({ name }: ConflictItem) => [
				name,
				``,
				``
			],
			measureRow: () => `Measure`
		})

		const items = props as ConflictItem[]
		setItems(items)
    }, [setItems])
    
    return (
        <div className="tableContainer">
			<VirtualTable ref={virtualTable} items={items} />
        </div>
    )
}

export default Conflicts
