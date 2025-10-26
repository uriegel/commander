import { useEffect, useRef, useState } from "react"
import type { ExtensionProps } from "web-dialog-react"

export interface ExtendedRenameProps {
    prefix: string
    digits: number
    startNumber: number
}

const ExtendedRenamePart = ({props, onChange }: ExtensionProps) => {

    const extendedRenameProps = useRef(props as ExtendedRenameProps)
    const [prefix, setPrefix] = useState((props as ExtendedRenameProps).prefix)
    const [digits, setDigits] = useState(`${(props as ExtendedRenameProps).digits}`)
    const [startNumber, setStartNumber] = useState(`${(props as ExtendedRenameProps).startNumber}`)

    const startNumberRef = useRef<HTMLInputElement>(null)

    const onPrefix = (val: string) => {
        extendedRenameProps.current.prefix = val
        setPrefix(val)
        if (onChange)
            onChange({ ...extendedRenameProps.current, prefix: val })
    }

    const onDigits = (val: string) => {
        extendedRenameProps.current.digits = val.parseInt() ?? 1 
        setDigits(val)
        if (onChange)
            onChange({ ...extendedRenameProps.current, digits: extendedRenameProps.current.digits })
    }

    const onStartNumber = (val: string) => {
        extendedRenameProps.current.startNumber = val.parseInt() ?? 1 
        setStartNumber(val)
        if (onChange)
            onChange({ ...extendedRenameProps.current, startNumber: extendedRenameProps.current.startNumber })
    }

    useEffect(() => {
        if (startNumberRef.current)
            startNumberRef.current.focus()
    }, [startNumberRef])
        
    const selectInput = (e: React.FocusEvent<HTMLInputElement>) => e.target?.select()

    return (
        <table>
            <tbody>
                <tr>
                    <td className="right">Prefix:</td>
                    <td>
                        <input className="wdr-focusable" type="text" value={prefix} onChange={e => onPrefix(e.target.value)} onFocus={selectInput} />
                    </td>
                </tr>
                <tr>
                    <td className="right">Stellen:</td>
                    <td>
                        <select value={digits} onChange={e => onDigits(e.target.value)} className="wdr-focusable">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <td className="right">Start:</td>
                    <td>
                        <input type="number" ref={startNumberRef} className="wdr-focusable" value={startNumber} onChange={e => onStartNumber(e.target.value)}
                        onFocus={selectInput} />
                    </td>
                </tr>
            </tbody>
        </table>
    )
}

export default ExtendedRenamePart