import './Statusbar.css'

export interface StatusbarProps {
    path: string
    dirCount: number
    fileCount: number
}

const Statusbar = ({path, dirCount, fileCount}: StatusbarProps) => {

    return (
        <div className='statusbar'>
            <span>{path}</span>
            <span className='fill'></span>
            <span>{`${dirCount} Verz.`}</span>
            <span className='lastStatus'>{`${fileCount} Dateien`}</span>
        </div>
    )
}

export default Statusbar