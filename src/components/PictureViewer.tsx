import { useRef } from 'react'
import './PictureViewer.css'

interface PictureViewerProps {
    path: string
}

const PictureViewer = ({ path }: PictureViewerProps) => {

    const nocache = useRef(0)

    return (
        <div className='viewer'>
            <img className='viewerImg'
                src={`http://localhost:20000/commander/${path.startsWith("android") ? "androidimage" : "image"}?path=${path}&nochache=${nocache.current++}`} alt="kein Bild gefunden" />
        </div>
    )
}

export default PictureViewer