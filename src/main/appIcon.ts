import { protocol } from "electron"
import { getIcon, getIconFromName } from "native"
import { isSvg } from "./icons.js"

export function registerGetAppIconProtocol() {
    protocol.handle('appicon', async (request) => {
        const url = new URL(request.url)
        const iconName = url.pathname.slice(1) || "ddd"// e.g. icon://folder.png → 'folder.png'
        const data = url.hostname == "name"
            ? await getIconFromName(iconName) //await readFile((await runCmd(`python3 ${iconFromNameScript} ${iconName}`)).trimEnd()) 
            : await getIcon(decodeURIComponent(iconName))

        if (data.length == 0) {
            console.log("icon not found", iconName)
            return new Response('Icon not found', { status: 404 })
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

