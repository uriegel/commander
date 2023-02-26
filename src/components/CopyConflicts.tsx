import { useEffect, useRef, useState } from 'react'
import VirtualTable, { TableRowItem, VirtualTableHandle } from 'virtual-table-react'
import { ExtensionProps } from 'web-dialog-react'
import { formatDateTime, formatSize } from '../controller/controller'
import { Version } from '../controller/requests'
import './CopyConflicts.css'
import IconName, { IconNameType } from './IconName'

export interface ConflictItem extends TableRowItem {
	name: string
	iconPath: string
    size?: number
    time?: string
    exifDate?: string
    version?: Version
    targetSize?: number
    targetTime?: string
    targetExifDate?: string
    targetVersion?: Version
}

const CopyConflicts = ({ props }: ExtensionProps) => {

    const virtualTable = useRef<VirtualTableHandle<ConflictItem>>(null)

    const [items, setItems] = useState([] as ConflictItem[])

    useEffect(() => {
		virtualTable.current?.setColumns({
			columns: [
				{ name: "Name"  },
				{ name: "Datum" },
				{ name: "Größe", isRightAligned: true }
			],
			renderRow: ({ name, iconPath, time, exifDate, targetExifDate, targetTime, size, targetSize }: ConflictItem) => [
					(<IconName namePart={name} type={IconNameType.File } iconPath={iconPath} />),
					(<div className=
						{
							(exifDate ?? time ?? "") > (targetExifDate ?? targetTime ?? "")
							? "overwrite"
							: (exifDate ?? time ?? "") < (targetExifDate ?? targetTime ?? "")
							? "notOverwrite"
							: ""
						}>
						<div>{formatDateTime(exifDate ?? time)}</div>
						<div>{formatDateTime(targetExifDate ?? targetTime)}</div>
					</div>),
					(<div className={targetSize == size ? "equal" : ""}>
						<div>{formatSize(size)}</div>
						<div>{formatSize(targetSize)}</div>
					</div>)
				]
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

export default CopyConflicts
