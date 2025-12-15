import { ExtensionProps } from "web-dialog-react"
import './OpenWith.css'
import VirtualTable, { VirtualTableHandle } from "virtual-table-react"
import { useEffect, useRef, useState } from "react"
import { getRecommendedApps } from "@/renderer/requests/requests"
import { App } from "native"

export type OpenWithProps = {
    fileName: string,
    filePath: string
}

export default function OpenWith({ props }: ExtensionProps) {

    const [apps, setApps] = useState<App[]>([])
    
    const virtualTable = useRef<VirtualTableHandle<App>>(null)

    useEffect(() => {
        const getApps = async () => {
            const apps = await getRecommendedApps((props as OpenWithProps).filePath + '/' + (props as OpenWithProps).fileName)
            setApps(apps)
        }

        getApps()

        virtualTable.current?.setColumns({
            columns: [{ name: "" }], 
            renderRow: s => [s.name]
        })
    }, [props])
    

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