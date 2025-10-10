import { protocol } from "electron";
import { readFile } from "fs/promises"

export function registerGetBinProtocol() {
    protocol.handle('bin', async (request) => {
    
        try {
            const url = new URL(request.url)
            const filePath = decodeURIComponent(url.pathname.slice(1))
            const host = url.host
            const ext = getExtension(filePath)

            const data = await readFile(filePath)
            return new Response(data as any, {
                headers: { 'Content-Type': getMime(ext) } 
            })
        } catch (err) {
            console.error('Failed to load icon', err)
            return new Response('Icon not found', { status: 404 })
        }
    })
}

function getExtension(filename: string) {
    const index = filename.lastIndexOf(".")
    return index > 0 ? filename.substring(index) : ""
}

function getMime(ext: string) {
    switch (ext.toLowerCase()) {
        case ".jpg":
            return 'image/jpg'
        case ".png":
            return 'image/png'
        case ".pdf":
            return 'application/pdf'
        default:
            return 'text/plain'
    }
}