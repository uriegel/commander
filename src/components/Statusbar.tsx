import { useEffect, useRef } from 'react'
import './Statusbar.css'

export interface StatusbarProps {
    path: string
    dirCount: number
    fileCount: number
    errorText: string | null
    setErrorText: (text: string|null)=>void
}

const Statusbar = ({ path, dirCount, fileCount, errorText, setErrorText }: StatusbarProps) => {

    const timer = useRef(0)

    useEffect(() => {
        console.log("setting effect timer", errorText, setErrorText)
        if (errorText) {
            console.log("setting effect timer errortext")
            clearTimeout(timer.current)
            timer.current = setTimeout(() => {
                setErrorText(null)
                console.log("resettet")
            }, 5000)            
        }
    }, [errorText, setErrorText])

    const getClasses = () => ["statusbar", errorText ? "error" : null].join(' ')

    return (
        <div className={getClasses()}>
            {errorText ||
                (<>
                    <span>{path}</span>
                    <span className='fill'></span>
                    <span>{`${dirCount} Verz.`}</span>
                    <span className='lastStatus'>{`${fileCount} Dateien`}</span>
                </>)}
        </div>
    )
}

export default Statusbar