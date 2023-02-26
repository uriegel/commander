import { useEffect, useRef, useState } from 'react'
import VirtualTable, { TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { ExtensionProps } from 'web-dialog-react'
import { formatDateTime, formatSize } from '../controller/controller'
import { Version } from '../controller/requests'

export interface ConflictItem extends TableRowItem {
	name: string
    size?: number
    time?: string
    exifDate?: string
    version?: Version
    targetSize?: number
    targetTime?: string
    targetExifDate?: string
    targetVersion?: Version
}

const Conflicts = ({ props }: ExtensionProps) => {

    const virtualTable = useRef<VirtualTableHandle<ConflictItem>>(null)

    const [items, setItems] = useState([] as ConflictItem[])

    useEffect(() => {
		virtualTable.current?.setColumns({
			columns: [
				{ name: "Name"  },
				{ name: "Datum" },
				{ name: "Größe", isRightAligned: true }
			],
			renderRow: ({ name, time, exifDate, targetExifDate, targetTime, size, targetSize }: ConflictItem) => [
					name,
					(<div>
						<div>{formatDateTime(exifDate ?? time)}</div>
						<div>{formatDateTime(targetExifDate ?? targetTime)}</div>
					</div>),
					(<div>
						<div>{formatSize(size)}</div>
						<div>{formatSize(targetSize)}</div>
					</div>)
				],
			measureRow: () => (
				<div>
					<div>time</div>
					<div>date</div>
				</div>
			),
		})

		const items = props as ConflictItem[]
		setItems(items)
    }, [setItems])
    
    return (
        <div className="tableContainer">
			<VirtualTable className='wdr-focusable' ref={virtualTable} items={items} />
        </div>
    )
}

export default Conflicts
