import { useRef } from 'react'
import './PictureViewer.css'
import { getViewerPath } from '../controller/controller'

interface PictureViewerProps {
    path: string
}

const PictureViewer = ({ path }: PictureViewerProps) => {

    const nocache = useRef(0)

    return (
        <div className='viewer'>
            <img className='viewerImg'
                src={`${getViewerPath(path)}`} alt="kein Bild gefunden" />
        </div>
    )
}

export default PictureViewer

// src={`${getViewerPath(path)}${path.startsWith("remote") ?nochache=${nocache.current++}`} "?" : "&"} alt="kein Bild gefunden" />