import 'leaflet/dist/leaflet.css'
import { map, tileLayer, Map as LMap, GPX } from "leaflet"
import "leaflet-gpx"
import useResizeObserver from '@react-hook/resize-observer'
import { useEffect, useRef } from "react"
import './TrackViewer.css'
import { getViewerPath } from '../controller/controller'

type TrackViewerProps = {
    path: string
}

const TrackViewer = ({ path }: TrackViewerProps) => {

    const first = useRef(false) 
    const resizeTimer = useRef(0) 
    const myMap = useRef<LMap | null>(null)

    const gpx = useRef<GPX|null>(null)

    const root = useRef<HTMLDivElement>(null)
    useResizeObserver(root, () => {
        clearTimeout(resizeTimer.current)
        resizeTimer.current = setTimeout(() => {
            myMap.current?.invalidateSize({ debounceMoveend: true })    
        }, 1000);
    })

    useEffect(() => {
        if (!first.current) {
            first.current = true
            myMap.current = map('map').setView([0, 0], 13)
            tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(myMap.current)
            gpx.current = new GPX(getViewerPath(path), { async: true }).on('loaded', e => {
                myMap.current?.fitBounds(e.target.getBounds())
            }).addTo(myMap.current)
        } else {
            gpx.current?.remove()
            gpx.current = new GPX(getViewerPath(path), { async: true }).on('loaded', e => {
                myMap.current?.fitBounds(e.target.getBounds())
            }).addTo(myMap.current!)
        }
    }, [path])

    return <div className="trackView" ref={root}>
        <div id="map" className="trackMap"></div>
    </div>
}

export default TrackViewer