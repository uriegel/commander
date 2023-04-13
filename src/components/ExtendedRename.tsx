import { useState } from "react"
import "../extensions/extensions"

const ExtendedRename = () => {

    const [prefix, setPrefix] = useState(localStorage.getItem("extendedRenamePrefix") ?? "Bild")
    const [digits, setDigits] = useState((localStorage.getItem("extendedRenameDigits") ?? "3"))
    const [startNumber, setStartNumber] = useState((localStorage.getItem("extendedRenameStartNumber") ?? "1"))

    return (
        <table>
            <tr>
                <td className="right">Prefix:</td>
                <td>
                    <input className="wdr-focusable" type="text" value={prefix} onChange={e => setPrefix(e.target.value)}/>
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
                    <input type="number" className="wdr-focusable" value={startNumber} onChange={e => setStartNumber(e.target.value)}/>
                </td>
            </tr>
        </table>
    )
}

export default ExtendedRename