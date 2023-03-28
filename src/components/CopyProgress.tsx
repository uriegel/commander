import react from 'react'

const CopyProgress = () => {
    return (
        <div className='copyProgress'>
            <p>filename</p>
            <progress className='currentProgress' max="0" value="0"></progress>
            <p>Gesamt:</p>
            <progress className='totalProgress' max="0" value="0"></progress>
        </div>
    )
}

export default CopyProgress