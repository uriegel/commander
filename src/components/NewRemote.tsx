import './NewRemote.css'

const NewRemote = () => {
    return (
        <div className='newRemote' >
            <input type="text" className='wdr-focusable' placeholder="Anzeigenamen festlegen" />
            <input type="text" className='wdr-focusable' placeholder="IP-Adresse des externen Gerätes" />
            <div>
                <input id="adderType" type="checkbox" className='wdr-focusable' />
                <label htmlFor="adderType">Android</label>
            </div>
        </div>
    )
}

export default NewRemote