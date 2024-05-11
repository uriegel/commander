import 'leaflet/dist/leaflet.css'
import { map, tileLayer, Map as LMap, GPX, Marker, Icon, marker } from "leaflet"
import "leaflet-gpx"
import useResizeObserver from '@react-hook/resize-observer'
import { useEffect, useRef, useState } from "react"
import './TrackViewer.css'
import { getViewerPath } from '../controller/controller'
import { ErrorType, jsonPost } from 'functional-extensions'

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

const myIcon = new Icon.Default({ imagePath: "http://localhost:20000/static/"})

const TrackViewer = ({ path }: TrackViewerProps) => {

    const first = useRef(false) 
    const resizeTimer = useRef(0) 
    const locationMarker = useRef<Marker<any>|null>(null)
    const myMap = useRef<LMap | null>(null)
    const gpx = useRef<GPX|null>(null)
    const root = useRef<HTMLDivElement>(null)
    const trackInfo = useRef<TrackInfo|null>(null)
    const [pointCount, setPointCount] = useState(0)
    const [position, setPosition] = useState(0)

    useResizeObserver(root, () => {
        clearTimeout(resizeTimer.current)
        resizeTimer.current = setTimeout(() => {
            myMap.current?.invalidateSize({ debounceMoveend: true, animate: true })    
        }, 400);
    })

    useEffect(() => {
        locationMarker.current?.remove()
        if (trackInfo.current?.trackPoints && trackInfo.current.trackPoints[position].latitude && trackInfo.current.trackPoints![position].longitude) {
            locationMarker.current = marker([trackInfo.current.trackPoints[position].latitude!, trackInfo.current.trackPoints[position].longitude!],
                { icon: myIcon }).addTo(myMap.current!)
        }
    }, [position])

    useEffect(() => {
        if (!first.current) {
            first.current = true
            myMap.current = map('map').setView([0, 0], 13)
            tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(myMap.current)
        } else 
            gpx.current?.remove()
        gpx.current = new GPX(getViewerPath(path), {
            async: true,
            marker_options: {
                startIconUrl: 'http://localhost:20000/static/pinstart.png',
                endIconUrl: 'http://localhost:20000/static/pinend.png',
                shadowUrl: 'http://localhost:20000/static/pinshadow.png'
                }
        }).on('loaded', e => {
            myMap.current?.fitBounds(e.target.getBounds())
        }).addTo(myMap.current!)
        jsonPost<TrackInfo, ErrorType>({ method: "gettrackinfo", payload: { path } })
            .match(n => {
                trackInfo.current = n
                setPosition(0)
                setPointCount(n.trackPoints?.length ?? 0)
            }, e => console.error(e))
    }, [path])

    return <div className="trackViewContainer">
        <div className="trackView" ref={root}>
            <div id="map" className="trackMap"></div>
        </div>
        <input type="range" min="1" max={pointCount} value={position} onChange={n => setPosition(Number.parseInt(n.target.value)-1)}></input>
    </div>

    
}

export default TrackViewer