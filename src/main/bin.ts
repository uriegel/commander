import { protocol } from "electron";
import { readFile } from "fs/promises"

export function registerGetBinProtocol() {
    protocol.handle('bin', async (request) => {
    
        try {
            const url = new URL(request.url)
            const filePath = url.pathname.slice(1)
            const host = url.host

            const data = await readFile(filePath)
            return new Response(data as any, {
                headers: {
                    'Content-Type': 'image/png', // TODO
                    //                    'Last-Modified': lastModified,
                    //                    'Cache-Control': 'public, max-age=3600'
                }
            })
        } catch (err) {
            console.error('Failed to load icon', err)
            return new Response('Icon not found', { status: 404 })
        }
    })
}