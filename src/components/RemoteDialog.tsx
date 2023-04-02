import { ExtensionProps } from 'web-dialog-react'
import { useEffect, useState } from 'react'
import './RemoteDialog.css'
import { FolderViewItem } from './FolderView'

const RemoteDialog = ({onChange, props }: ExtensionProps) => {

    console.log("props", props)
    console.log("onChange", onChange)

    const [name, setName] = useState((props as FolderViewItem)?.name)
    const [ipAddress, setIpAddress] = useState((props as FolderViewItem)?.ipAddress)
    const [isAndroid, setIsAndroid] = useState((props as FolderViewItem)?.isAndroid)
    
    const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => 
        setName(e.target.value)
    
    const onIpChange = (e: React.ChangeEvent<HTMLInputElement>) => 
        setIpAddress(e.target.value)
    
    const onIsAndroid = (e: React.ChangeEvent<HTMLInputElement>) => 
        setIsAndroid(e.target.checked)
        
    useEffect(() => {
        if (onChange)
            onChange({
                name,
                ipAddress,
                isAndroid
            })
    })

    return (
        <div className='remoteDialog' >
            <input type="text" className='wdr-focusable' placeholder="Anzeigenamen festlegen" value={name} onChange={onNameChange} />
            <input type="text" className='wdr-focusable' placeholder="IP-Adresse des externen Gerätes" value={ipAddress} onChange={onIpChange}/>
            <div>
                <input id="adderType" type="checkbox" className='wdr-focusable' checked={isAndroid} onChange={onIsAndroid} />
                <label htmlFor="adderType">Android</label>
            </div>
        </div>
    )
}

export default RemoteDialog