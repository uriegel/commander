import { useEffect, useState } from 'react'
import type { ExtensionProps } from 'web-dialog-react'
import { Item, RemotesItem } from '@/renderer/items-provider/items'
import './Remote.css'

const Remote = ({onChange, props }: ExtensionProps) => {

    const [name, setName] = useState((props as Item)?.name)
    const [ipAddress, setIpAddress] = useState((props as RemotesItem)?.ipAddress)
    const [isAndroid, setIsAndroid] = useState((props as RemotesItem)?.isAndroid)
    
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
        <div className='dialog' >
            <input type="text" className='wdr-focusable' placeholder="Anzeigenamen festlegen" value={name}
                onChange={onNameChange} onFocus={e => e.currentTarget.select()} />
            <input type="text" className='wdr-focusable' placeholder="IP-Adresse des externen Gerätes" value={ipAddress}
                onChange={onIpChange} onFocus={e => e.currentTarget.select()} />
            <div>
                <input id="adderType" type="checkbox" className='wdr-focusable' checked={isAndroid} onChange={onIsAndroid} />
                <label htmlFor="adderType">Android</label>
            </div>
        </div>
    )
}

export default Remote