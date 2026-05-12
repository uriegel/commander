import { useCallback, useEffect, useRef, useState } from 'react'
import VirtualTable, { type VirtualTableHandle } from 'virtual-table-react'
import './CopyConflicts.css'
import IconName from '../IconName'
import type { ExtensionProps } from 'web-dialog-react'
import type { CopyItem } from '../../requests/model'
import { IconNameType } from '../../items-provider/items'
import { formatDateTime, formatSize } from '../../items-provider/provider'
import { getSpecificConflictsColumns } from '../../platform/copy-conflicts'

const CopyConflicts = ({ props }: ExtensionProps) => {

    const virtualTable = useRef<VirtualTableHandle<CopyItem>>(null)

    const [items, setItems] = useState([] as CopyItem[])

	const getColumns = () => [
		{ name: "Name"  },
		{ name: "Datum" },
		{ name: "Größe", isRightAligned: true },
           ...getSpecificConflictsColumns()
	]

	const renderRowItem = ({ name, iconPath, time, targetTime, size, targetSize }: CopyItem) => {
		const index = name.lastIndexOfAny( ['\\', '/'])
		const filename = index == -1 ? name : name.substring(index)
		const subPath = index == -1 ? "" : name.substring(0, index - 1)
		return [
			(<div>
				<IconName namePart={filename} type={IconNameType.File} iconPath={iconPath} />
				<div className={subPath ? 'subPath' : 'subPath empty'}>{subPath ?? "___"}</div>
			</div>),
			(<div className=
				{
					(time?.substring(0, 16) || 0) > (targetTime?.substring(0, 16) || 0)
						? "overwrite"
						: (time?.substring(0, 16) || 0) < (targetTime?.substring(0, 16) || 0)
							? "notOverwrite"
							: "equal"
				}>
				<div>{formatDateTime(time)}</div>
				<div>{formatDateTime(targetTime)}</div>
			</div>),
			(<div className={targetSize == size ? "equal" : ""}>
				<div>{formatSize(size)}</div>
				<div>{formatSize(targetSize)}</div>
			</div>)
		]
	}

	const renderRow = useCallback((item: CopyItem) => 
        renderRowItem(item),
    [])

    useEffect(() => {
		virtualTable.current?.setColumns({
			columns: getColumns(), 
			renderRow
        })
		setTimeout(() => setItems(
			(props as CopyItem[]).map(n => (
				{
					name: n.name, iconPath: n.iconPath, isDirectory: false,
					time: n.time, size: n.size, targetSize: n.targetSize, targetTime: n.targetTime
				}
			))))
		
    }, [setItems, props, renderRow])
    
    return (
        <div className="tableContainer">
			<VirtualTable className='wdr-focusable' ref={virtualTable} items={items} />
        </div>
    )
}

export default CopyConflicts
