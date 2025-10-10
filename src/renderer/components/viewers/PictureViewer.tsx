import { useEffect, useRef, useState } from 'react'
import './PictureViewer.css'
import { getViewerPath } from './viewers'

interface PictureViewerProps {
    path: string
    latitude?: number
    longitude?: number
}

const PictureViewer = ({ path, latitude, longitude }: PictureViewerProps) => {

    const nocache = useRef(0)

    console.log("PictureViewer", latitude, longitude)

    const [newValue, setNewValue] = useState(0)

    useEffect(() => setNewValue(nocache.current++), [path]) // or [] if you only want to increment once per new path

    return (
        <div className='viewer'>
            <img className='viewerImg'
                src={`${getViewerPath(path)}?nochache=${newValue}`} alt="kein Bild gefunden" />
        </div>
    )
}

export default PictureViewer

