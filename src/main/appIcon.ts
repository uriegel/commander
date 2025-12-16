import { protocol } from "electron"
import { getAppIcon } from "native"
import { isSvg } from "./icons.js"

export function registerGetAppIconProtocol() {
    protocol.handle('appicon', async (request) => {
        const url = new URL(request.url)
        const app = Number.parseInt(url.pathname.slice(1) || "ddd") // e.g. icon://folder.png → 'folder.png'
        const data = await getAppIcon(app)

        if (data.length == 0) {
            console.log("app icon not found")
            return new Response('App icon not found', { status: 404 })
        }

        try {
            return new Response(data as any, {
                headers: {
                    'Content-Type': isSvg(data) ? 'image/svg+xml' : 'image/png',
                    'Content-Length': `${data.length}`,
                    'Cache-Control': 'public, max-age=3600'
                }
            })
        } catch (err) {
            console.error('Failed to load icon', err)
            return new Response('Icon not found', { status: 404 })
        }
    })
}

