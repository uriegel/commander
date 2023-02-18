import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { TableRowItem } from 'virtual-table-react'
import { FolderItem } from '../controller/requests'
import './RestrictionView.css'

export type RestrictionViewHandle = {
    checkKey: (code: string) => TableRowItem[] | null
    reset: ()=>void
}

interface RestrictionViewProps {
    items: TableRowItem[]
}

const RestrictionView = forwardRef<RestrictionViewHandle, RestrictionViewProps>((
    { items }, ref) => {

    const [restriction, setRestriction] = useState("")
    const refItems = useRef<FolderItem[]|null>(null)

    useImperativeHandle(ref, () => ({
        checkKey(code: string) {
            const test =
                code == "Backspace"
                    ? restriction.length > 0 ? restriction.substring(0, restriction.length - 1) : ""
                    : code == "Escape"
                        ? ""
                        : restriction + code

            if (test.length > 0) {
                const itemsToCheck = refItems.current ?? items as FolderItem[]
                const restrictedItems = itemsToCheck.filter(n => n.name.toLocaleLowerCase().startsWith(test))
                if (restrictedItems.length > 0) {
                    if (refItems.current == null)
                        refItems.current = items as FolderItem[]
                    setRestriction(test)
                    return restrictedItems.map((n, i) => ({ ...n, index: i }))!
                }
                else
                    return null
            } else if (refItems.current != null) {
                const originalItems = refItems.current
                this.reset()
                return originalItems
            } else
                return null
        },
        reset() {
            setRestriction("")
            refItems.current = null
        }
    }))

    return (
        <input value={restriction} className={`restriction${restriction.length > 0 ? " show" : ""} `} readOnly />
    )
    
})



export default RestrictionView