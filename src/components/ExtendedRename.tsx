import { useEffect, useRef, useState } from "react"
import "../extensions/extensions"

const ExtendedRename = () => {

    const [prefix, setPrefix] = useState(localStorage.getItem("extendedRenamePrefix") ?? "Bild")
    const [digits, setDigits] = useState((localStorage.getItem("extendedRenameDigits") ?? "3"))
    const [startNumber, setStartNumber] = useState((localStorage.getItem("extendedRenameStartNumber") ?? "1"))

    const startNumberRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (startNumberRef.current)
            return () => {
                localStorage.setItem("extendedRenamePrefix", prefix)
                localStorage.setItem("extendedRenameDigits", digits)
                localStorage.setItem("extendedRenameStartNumber", startNumber)
            }
    }, [prefix, digits, startNumber])

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
                        <input className="wdr-focusable" type="text" value={prefix} onChange={e => setPrefix(e.target.value)} onFocus={selectInput} />
                    </td>
                </tr>
                <tr>
                    <td className="right">Stellen:</td>
                    <td>
                        <select value={digits} onChange={e => setDigits(e.target.value)} className="wdr-focusable">
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
                        <input type="number" ref={startNumberRef} className="wdr-focusable" value={startNumber} onChange={e => setStartNumber(e.target.value)}
                        onFocus={selectInput} />
                    </td>
                </tr>
            </tbody>
        </table>
    )
}

export default ExtendedRename