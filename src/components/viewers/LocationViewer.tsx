import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import L from 'leaflet'
import './LocationViewer.css'
import useResizeObserver from '@react-hook/resize-observer'
import { Map as LMap } from "leaflet"
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { useEffect, useRef } from 'react'

export const DefaultIcon = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

// Replace the default icon globally
L.Marker.prototype.options.icon = DefaultIcon

type LocationViewerProps = {
    latitude: number
    longitude: number
}

const LocationViewer = ({ latitude, longitude }: LocationViewerProps) => {

    const myMap = useRef<LMap | null>(null)
    const root = useRef<HTMLDivElement>(null)

    useEffect(() => {
        myMap.current?.setView([latitude!, longitude!])
    }, [latitude, longitude])

    useResizeObserver(root, () => {
        myMap.current?.invalidateSize({ debounceMoveend: true, animate: true })    
    })

    return (
        <div className="locationView" ref={root}>
            <MapContainer className='location' ref={myMap} center={[latitude, longitude]} zoom={13} scrollWheelZoom={true} >
                <TileLayer attribution='' url="https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png" />
                <Marker position={[latitude, longitude]}>
                    <Popup>Der Aufnahmestandort.</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}

export default LocationViewer


