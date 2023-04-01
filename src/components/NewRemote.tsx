import { ExtensionProps } from 'web-dialog-react'
import { useEffect, useState } from 'react'
import './NewRemote.css'

const NewRemote = ({onChange}: ExtensionProps) => {

    const [name, setName] = useState("")
    const [ip, setIp] = useState("")
    const [isAndroid, setIsAndroid] = useState(true)
    
    const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => 
        setName(e.target.value)
    
    const onIpChange = (e: React.ChangeEvent<HTMLInputElement>) => 
        setIp(e.target.value)
    
    const onIsAndroid = (e: React.ChangeEvent<HTMLInputElement>) => 
        setIsAndroid(e.target.checked)
        
    useEffect(() => {
        if (onChange)
            onChange({
                name,
                ip,
                isAndroid
            })
    })

    return (
        <div className='newRemote' >
            <input type="text" className='wdr-focusable' placeholder="Anzeigenamen festlegen" value={name} onChange={onNameChange} />
            <input type="text" className='wdr-focusable' placeholder="IP-Adresse des externen Gerätes" value={ip} onChange={onIpChange}/>
            <div>
                <input id="adderType" type="checkbox" className='wdr-focusable' checked={isAndroid} onChange={onIsAndroid} />
                <label htmlFor="adderType">Android</label>
            </div>
        </div>
    )
}

export default NewRemote