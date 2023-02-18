import { forwardRef, useImperativeHandle, useState } from 'react'
import { TableRowItem } from 'virtual-table-react'
import { FolderItem } from '../controller/requests'
import './RestrictionView.css'

export type RestrictionViewHandle = {
    checkKey: (code: string)=>TableRowItem[]|null
}

interface RestrictionViewProps {
    items: TableRowItem[]
}

const RestrictionView = forwardRef<RestrictionViewHandle, RestrictionViewProps>((
    { items }, ref) => {

    const [restriction, setRestriction] = useState("")

    useImperativeHandle(ref, () => ({
        checkKey(code: string) {

            console.log(code)

            const test =
                code == "Backspace"
                ? restriction.length > 0 ? restriction.substring(0, restriction.length - 1) : ""
                : code == "Escape"
                ? ""
                : restriction + code
            
            const restrictedItems = (items as FolderItem[]).filter(n => n.name.toLocaleLowerCase().startsWith(test))
            if (restrictedItems.length > 0)
                setRestriction(test)
            return null
        }
    }))

    return (
        <input value={restriction} className={`restriction${restriction.length > 0 ? " show" : ""} `} readOnly />
    )
    
})



export default RestrictionView