import './MediaPlayer.css'

interface MediaPlayerProps {
    path: string
}

const MediaPlayer = ({ path }: MediaPlayerProps) => (
    <div className='viewer'>
        <video className='mediaPlayer' controls autoPlay
            src={`http://localhost:20000/commander/${path.startsWith("android") ? "androidmovie" : "movie"}?path=${path}`} />        
    </div>
)

export default MediaPlayer