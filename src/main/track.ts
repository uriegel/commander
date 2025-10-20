import { protocol } from "electron"
import { getGpxTrack } from "filesystem-utilities"
import { writeJson } from "./requests.js"

export function registerGetTrackProtocol() {
    protocol.handle('track', async (request) => {
    
        try {
            const url = new URL(request.url)
            const filePath = decodeURIComponent(url.pathname.slice(1))
            const track = await getGpxTrack(filePath)
            return writeJson(track)
        } catch (err) {
            console.error('Failed to load icon', err)
            return new Response('Icon not found', { status: 404 })
        }
    })
}
