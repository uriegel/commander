import { useState } from 'react'
import './RestrictionView.css'

const RestrictionView = () => {

    const [show, setShow] = useState(false)

    return (
        <input className={`restriction${show ? " show" : ""} `} readOnly />
    )
}

export default RestrictionView