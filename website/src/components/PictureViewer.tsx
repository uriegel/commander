import './PictureViewer.css'
import { getViewerPath } from '../controller/controller'

interface PictureViewerProps {
    path: string
    latitude?: number
    longitude?: number
}

const PictureViewer = ({ path, latitude, longitude }: PictureViewerProps) => {
    console.log("PictureViewer", latitude, longitude)

    return (
        <div className='viewer'>
            <img className='viewerImg'
            //src={`${getViewerPath(path)}${path.startsWith("remote") ? '?' : '&'}nochache=${nocache.current++}`} alt="kein Bild gefunden" />
            src={`${getViewerPath(path)}`} alt="kein Bild gefunden" />
        </div>
    )
}

export default PictureViewer

