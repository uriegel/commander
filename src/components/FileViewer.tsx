import './FileViewer.css'

interface FileViewerProps {
    path: string
}

const FileViewer = ({ path }: FileViewerProps) => (
    <div className='viewer'>
        <iframe frameBorder={0} className="fileViewer"
            src={`http://localhost:20000/commander/${path.startsWith("android") ? "androidfile" : "file"}?path=${path}`} />
    </div>
)

export default FileViewer