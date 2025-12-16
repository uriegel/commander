import { ExtensionProps } from "web-dialog-react"
import './OpenWith.css'
import VirtualTable, { VirtualTableHandle } from "virtual-table-react"
import { useEffect, useRef, useState } from "react"
import { getRecommendedApps } from "@/renderer/requests/requests"
import { App } from "native"

export type OpenWithProps = {
    fileName: string,
    filePath: string,
    app?: App
}

export default function OpenWith({ props, onChange }: ExtensionProps) {

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
            renderRow: app => [
                (<span>
                    <img className="appImage" src={`appicon://app/${app.app}`} alt="" />
                    <span>{app.name}</span>
                </span>)
            ]
        })
    }, [props])

    const onPosition = (app: App) => {
        if (onChange)
            onChange({ ...props, app })
    }

    return (
        <div className="openWith">
            <div>
                <span>Wähle eine Anwendung, um</span>
                <span className="file">{(props as OpenWithProps).fileName}</span>
                <span>zu öffnen</span>
            </div>
            <div className="tableContainer">
	            <VirtualTable className='wdr-focusable' ref={virtualTable} items={apps} onPosition={onPosition} />
            </div>
        </div>
    )
}