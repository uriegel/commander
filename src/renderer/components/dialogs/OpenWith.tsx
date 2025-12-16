import { ExtensionProps } from "web-dialog-react"
import './OpenWith.css'
import VirtualTable, { VirtualTableHandle } from "virtual-table-react"
import { useEffect, useRef, useState } from "react"
import { getRecommendedApps } from "@/renderer/requests/requests"
import { App } from "native"
import New from "@/renderer/svg/New"

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
            setApps([...apps, { name: "Alle Apps anzeigen...", executable: "" } as App])
        }

        getApps()

        virtualTable.current?.setColumns({
            columns: [{ name: "" }], 
            renderRow: app => [
                app.executable != ""
                    ? (<span>
                        <img className="appImage" src={`appicon://app/${app.app}`} alt="" />
                        <span>{app.name}</span>
                    </span>)
                    : (<span>
                        <span className="appImage new">
                            <New />
                        </span>
                        <span>{app.name}</span>
                    </span>)
            ]
        })
    }, [props])

    useEffect(() => {
        return () => {
            // TODO cleanup all apps
            console.log("cleaning up...", apps)
        }
    }, [apps])

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