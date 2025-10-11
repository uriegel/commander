import './PictureViewer.css'
import { getViewerPath } from './viewers'

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
                src={`${getViewerPath(path)}?nochache=${getNoCacheId()}`} alt="kein Bild gefunden" />
        </div>
    )
}

const getNoCacheId = () => ++noCacheId

var noCacheId = 0

export default PictureViewer

