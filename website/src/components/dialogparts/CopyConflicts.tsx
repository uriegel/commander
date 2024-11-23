import { useCallback, useEffect, useRef, useState } from 'react'
import VirtualTable, { VirtualTableHandle } from 'virtual-table-react'
import { ExtensionProps } from 'web-dialog-react'
import { formatDateTime, formatSize, formatVersion } from '../../controller/controller'
import { compareVersion } from '../../controller/filesystem'
import { Version } from '../../requests/requests'
import { getPlatform, Platform } from '../../globals'
import './CopyConflicts.css'
import IconName from '../IconName'
import { IconNameType } from '../../enums'

export interface ConflictItem {
	name: string
	iconPath?: string
    size?: number
    time?: string
    version?: Version
    targetSize?: number
    targetTime?: string
    targetVersion?: Version
}

const CopyConflicts = ({ props }: ExtensionProps) => {

    const virtualTable = useRef<VirtualTableHandle<ConflictItem>>(null)

    const [items, setItems] = useState([] as ConflictItem[])

	const getWindowsColumns = () => [
		{ name: "Name"  },
		{ name: "Datum" },
		{ name: "Größe", isRightAligned: true },
		{ name: "Version" }
	]

	const getLinuxColumns = () => [
		{ name: "Name"  },
		{ name: "Datum" },
		{ name: "Größe", isRightAligned: true }
	]

	const renderRowBase = ({ name, iconPath, time, targetTime, size, targetSize }: ConflictItem) => [
		(<div>
			<IconName namePart={name} type={IconNameType.File} iconPath={iconPath} />
		</div>),
		(<div className=
			{
				(time ?? "") > (targetTime ?? "")
				? "overwrite"
				: (time ?? "") < (targetTime ?? "")
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

	const getVersionCompareClass = (a?: Version, b?: Version) => {
		const v = compareVersion(a, b) 
		return v > 0 
			? "overwrite"
			: v < 0 
			? "notOverwrite"
			: "equal"
}

	const renderRow = useCallback((item: ConflictItem) => 
		getPlatform() == Platform.Windows 
		? renderRowBase(item).concat((
			<div className= {getVersionCompareClass(item.version, item.targetVersion)}>
				<div>{formatVersion(item.version)}</div>
				<div>{formatVersion(item.targetVersion)}</div>
			</div>))
		: renderRowBase(item), [])

    useEffect(() => {
		virtualTable.current?.setColumns({
			columns: getPlatform() == Platform.Windows ? getWindowsColumns() : getLinuxColumns(), 
			renderRow
		})

		const items = props as ConflictItem[]
		setItems(items)
    }, [setItems, props, renderRow])
    
    return (
        <div className="tableContainer">
			<VirtualTable className='wdr-focusable' ref={virtualTable} items={items} />
        </div>
    )
}

export default CopyConflicts
