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

let noCacheId = 0
const getNoCacheId = () => ++noCacheId

export default PictureViewer

