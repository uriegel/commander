import { ExtensionProps } from "web-dialog-react"
import './OpenWith.css'
import VirtualTable, { VirtualTableHandle } from "virtual-table-react"
import { useEffect, useRef } from "react"

export type OpenWithProps = {
    fileName: string,
    filePath: string
}

export default function OpenWith({ props }: ExtensionProps) {

    const apps = [...Array(50).keys()].map(n => `Äpp #${n + 100}`)
    
    const virtualTable = useRef<VirtualTableHandle<string>>(null)

    useEffect(() => {
        virtualTable.current?.setColumns({
            columns: [{ name: "" }], 
            renderRow: s => [s]
        })
    }, [])
    

    return (
        <div className="openWith">
            <div>
                <span>Wähle eine Anwendung, um</span>
                <span className="file">{(props as OpenWithProps).fileName}</span>
                <span>zu öffnen</span>
            </div>
            <div className="tableContainer">
	            <VirtualTable className='wdr-focusable' ref={virtualTable} items={apps} />
            </div>
        </div>
    )
}