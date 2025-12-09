import 'leaflet/dist/leaflet.css'
import './TrackViewer.css'
import useResizeObserver from '@react-hook/resize-observer'
import { Map as LMap, type LatLngExpression } from "leaflet"
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet'
import { useEffect, useRef, useState } from 'react'
import { GpxTrack, GpxPoint } from 'native'

type TrackViewerProps = {
    path: string
}

const TrackViewer = ({ path }: TrackViewerProps) => {

    const myMap = useRef<LMap | null>(null)
    const root = useRef<HTMLDivElement>(null)
    const [track, setTrack] = useState<number[][]>([[0, 0]])
    const [trackPoints, setTrackPoints] = useState<GpxPoint[]>([])
    const [pointCount, setPointCount] = useState(0)
    const [position, setPosition] = useState(0)
    const [heartRate, setHeartRate] = useState(0)
    const [velocity, setVelocity] = useState(0)
    const [averageVelocity, setAverageVelocity] = useState<number|undefined>(undefined)
    const [averageHeartRate, setAverageHeartRate] = useState(0)
    const [maxVelocity, setMaxVelocity] = useState(0)
    const [maxHeartRate, setMaxHeartRate] = useState(0)
    const [distance, setDistance] = useState(0)
    const [duration, setDuration] = useState(0)
    
    useEffect(() => {
        async function getTrack(path: string) {
            try {
                const response = await fetch(`track://local/${path}`)
                const track = await response.json() as GpxTrack
                setPosition(0)
                setPointCount(track.trackPoints?.length ?? 0)
                if (!track.trackPoints?.length)
                    return
                setTrackPoints(track.trackPoints)
                setAverageVelocity(track.averageSpeed)
                setDistance(track.distance)
                setDuration(track.duration)
                const trk = track.trackPoints?.map(n => [n.lat!, n.lon!])
                if (trk) {
                    setTrack(trk)
                    const maxLat = trk.reduce((prev, curr) => Math.max(prev, curr[0]), trk[0][0])
                    const minLat = trk.reduce((prev, curr) => Math.min(prev, curr[0]), trk[0][0])
                    const maxLng = trk.reduce((prev, curr) => Math.max(prev, curr[1]), trk[0][1])
                    const minLng = trk.reduce((prev, curr) => Math.min(prev, curr[1]), trk[0][1])
                    setMaxVelocity((track.trackPoints?.max(t => t.velocity ?? 0) ?? 0) * 3.6)
                    const mhr = track.trackPoints?.max(t => t.heartrate ?? 0) ?? 0
                    setMaxHeartRate(mhr != -1 ? mhr : 0)
                    const ahr = Math.floor(track.trackPoints?.filter(n => n.heartrate != -1 && n.heartrate != 0)?.average(t => t.heartrate))
                    setAverageHeartRate(ahr && !isNaN(ahr) ? ahr : 0)
                    myMap.current?.fitBounds([[maxLat, maxLng], [minLat, minLng]])
                }
            }
            catch (e) { console.error("error in track", e) }
        }

        getTrack(path)
    }, [path])

    useResizeObserver(root, () => {
        myMap.current?.invalidateSize({ debounceMoveend: true, animate: true })    
    })

    const onPosition = (pos: number) => {
        setPosition(pos)
        setHeartRate(trackPoints[pos].heartrate ?? 0)
        setVelocity((trackPoints[pos].velocity ?? 0) * 3.6)
    }

    const onMaxHeartRate = () => {
        const i = trackPoints.findIndex(n => n.heartrate == maxHeartRate)
        if (i != -1)
            onPosition(i)
    }

    const onMaxVelocity = () => {
        const i = trackPoints.findIndex(n => n.velocity == maxVelocity)
        if (i != -1)
            onPosition(i)
    }

    const formatDistance = (dist: number) => {
        const pad = (n: number) => ('' + n).padStart(2, '0')

        const hours = Math.floor(dist / 3600)
        const min = Math.floor(dist % 3600 / 60)
        
        return `${pad(hours)}:${pad(min)}`
    }

    return (
        <div className="trackView" ref={root}>
            <MapContainer className='track' ref={myMap} center={[0, 0]} zoom={13} scrollWheelZoom={true} >
                <TileLayer attribution='' url="https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png" />
                <Marker position={track[position] as LatLngExpression}></Marker> 
                <Polyline pathOptions={{ fillColor: 'red', color: 'blue' }}
                    positions={track as LatLngExpression[]}/>
            </MapContainer>
            <div className="trackPopup bottom">
                <div>{velocity.toFixed(1)} km/h</div>
                <div>❤️ {heartRate}</div>
            </div>
            <div className="trackPopup ">
                <div>{distance.toFixed(1)} km</div>
                <div>{formatDistance(duration)}</div>
                <div>Ø {averageVelocity?.toFixed(1)} km/h</div>
                <div className="button" onClick={() => onMaxVelocity()}>Max {maxVelocity.toFixed(1)} km/h</div>
                <div>Ø❤️ {averageHeartRate}</div>
                <div className="button" onClick={() => onMaxHeartRate()}>Max❤️ {maxHeartRate}</div>
            </div>
            <input type="range" min="1" max={pointCount} value={position} onChange={n => onPosition(Number.parseInt(n.target.value)-1)}></input>
        </div>
    )
}

export default TrackViewer