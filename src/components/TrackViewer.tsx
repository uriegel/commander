import 'leaflet/dist/leaflet.css'
import './TrackViewer.css'
import useResizeObserver from '@react-hook/resize-observer'
import { Map as LMap } from "leaflet"
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import { useEffect, useRef, useState } from 'react'
import { ErrorType, jsonPost } from 'functional-extensions'
import { LatLngExpression } from 'leaflet'

type TrackInfo = {
    name?: string
    description?: string
    trackPoints?: TrackPoint[] 
}

type TrackPoint = {
    latitude?: number
    longitude?: number
    elevation?: number
    time?: Date
}

type TrackViewerProps = {
    path: string
}

const TrackViewer = ({ path }: TrackViewerProps) => {

    const myMap = useRef<LMap | null>(null)
    const root = useRef<HTMLDivElement>(null)
    const [track, setTrack] = useState<number[][]>([[0, 0]])
    const [pointCount, setPointCount] = useState(0)
    const [position, setPosition] = useState(0)
    
    useEffect(() => {
        jsonPost<TrackInfo, ErrorType>({ method: "gettrackinfo", payload: { path } })
            .match(n => {
                setPosition(0)
                setPointCount(n.trackPoints?.length ?? 0)
                const trk = n.trackPoints?.map(n => [n.latitude!, n.longitude!])
                if (trk) {
                    setTrack(trk)

                    var maxLat = trk.reduce((prev, curr) => Math.max(prev, curr[0]), trk[0][0])
                    var minLat = trk.reduce((prev, curr) => Math.min(prev, curr[0]), trk[0][0])
                    var maxLng = trk.reduce((prev, curr) => Math.max(prev, curr[1]), trk[0][1])
                    var minLng = trk.reduce((prev, curr) => Math.min(prev, curr[1]), trk[0][1])
                    console.log("min", maxLat, minLat, maxLng, minLng)
    
                    myMap.current?.fitBounds([[maxLat, maxLng], [minLat, minLng]], {
                        //padding: [20, 20]
                    })
                }
            }, e => console.error(e))
    }, [path])

    useResizeObserver(root.current, () => {
        myMap.current?.invalidateSize({ debounceMoveend: true, animate: true })    
    })

    return (
        <div className="trackView" ref={root}>
            <MapContainer className='track' ref={myMap} center={[0, 0]} zoom={13} scrollWheelZoom={true} >
                <TileLayer attribution='' url="https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png" />
                <Marker position={track[position] as LatLngExpression}></Marker> 
                <Polyline pathOptions={{ fillColor: 'red', color: 'blue' }}
                    positions={track as LatLngExpression[]}/>
            </MapContainer>
            <input type="range" min="1" max={pointCount} value={position} onChange={n => setPosition(Number.parseInt(n.target.value)-1)}></input>
        </div>
    )
}

export default TrackViewer



