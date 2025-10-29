import { useEffect, useState } from "react"
import './Credentials.css'
import type { ExtensionProps } from "web-dialog-react"

export interface CredentialsProps {
    name: string
    password: string
}

const Credentials = ({onChange, props }: ExtensionProps) => {

    const credentialsProps = props as CredentialsProps
    const [name, setName] = useState(credentialsProps.name)
    const [password, setPassword] = useState(`${credentialsProps.password}`)

    const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => 
        setName(e.target.value)

    const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => 
        setPassword(e.target.value)

    useEffect(() => {
        if (onChange)
            onChange({
                name,
                password,
            })
    })
    
    return (
        <div className='dialog' >
            <input type="text" className='wdr-focusable' placeholder="<Domain>\<Name>" value={name} onChange={onNameChange} />
            <input type="password" className='wdr-focusable' placeholder="Passwort" value={password} onChange={onPasswordChange}/>
        </div>
    )
}

export default Credentials