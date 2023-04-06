import { getViewerPath } from '../controller/controller'
import './FileViewer.css'

interface FileViewerProps {
    path: string
}

const FileViewer = ({ path }: FileViewerProps) => (
    <div className='viewer'>
        <iframe frameBorder={0} className="fileViewer"
            src={getViewerPath(path)} />
    </div>
)

export default FileViewer