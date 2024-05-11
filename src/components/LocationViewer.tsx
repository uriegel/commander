import 'leaflet/dist/leaflet.css'
import { map, marker, tileLayer, Map as LMap, Marker, Icon } from "leaflet"
import useResizeObserver from '@react-hook/resize-observer'
import { useEffect, useRef } from "react"
import './LocationViewer.css'

type LocationViewerProps = {
    latitude?: number
    longitude?: number
}

const myIcon = new Icon.Default({ imagePath: "http://localhost:20000/static/"})

const LocationViewer = ({latitude, longitude }: LocationViewerProps) => {

    const first = useRef(false) 
    const resizeTimer = useRef(0) 
    const myMap = useRef<LMap | null>(null)
    const locationMarker = useRef<Marker<any>|null>(null)

    const root = useRef<HTMLDivElement>(null)
    useResizeObserver(root, () => {
        clearTimeout(resizeTimer.current)
        resizeTimer.current = setTimeout(() => {
            myMap.current?.invalidateSize({ debounceMoveend: true, animate: true })    
        }, 400);
    })

    useEffect(() => {
        if (first.current && longitude && latitude && myMap.current) {
            myMap.current?.setView([latitude, longitude], 13)
            locationMarker.current?.remove()
            locationMarker.current = marker([latitude, longitude], {icon: myIcon}).addTo(myMap.current)
        }
    }, [latitude, longitude])

    useEffect(() => {
        if (!first.current && longitude && latitude) {
            first.current = true
            myMap.current = map('map').setView([latitude, longitude], 13)
            tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(myMap.current)
            locationMarker.current?.remove()
            locationMarker.current = marker([latitude, longitude], {icon: myIcon}).addTo(myMap.current)
        }
    }, [longitude, latitude])

    return <div className="locationView" ref={root}>
        <div id="map" className="locationMap"></div>
    </div>
}

export default LocationViewer