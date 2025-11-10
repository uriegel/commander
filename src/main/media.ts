import { protocol } from "electron";
import { createReadStream } from "fs";
import { readFile, stat } from "fs/promises"
import { Readable } from "stream";

export function registerGetMediaProtocol() {
    protocol.handle('media', async (request) => {
    
        try {
            const url = new URL(request.url)
            const filePath = decodeURIComponent(url.pathname.slice(1))
            const ext = getExtension(filePath)

            const stats = await stat(filePath)

            const range = request.headers.get('range')
            if (!range) {
                const data = await readFile(filePath)
                return new Response(data as any, {
                    headers: {
                        'Content-Type': getMime(ext),
                        'Content-Length': stats.size.toString(),
                        'Accept-Ranges': 'bytes'
                    }
                })
            }  else {
                const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
                const start = parseInt(startStr, 10)
                const end = endStr ? parseInt(endStr, 10) : stats.size - 1
                const chunkSize = (end - start) + 1

                return new Response(Readable.toWeb(createReadStream(filePath, { start, end })) as any, {
                    status: 206,
                    headers: {
                        'Content-Type': getMime(ext),
                        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunkSize.toString(),
                    }
                })
            }
        } catch (err) {
            console.error('Failed to load icon', err)
            return new Response('Media file not found', { status: 404 })
        }
    })
}

function getExtension(filename: string) {
    const index = filename.lastIndexOf(".")
    return index > 0 ? filename.substring(index) : ""
}

function getMime(ext: string) {
    switch (ext.toLowerCase()) {
        case ".mp4":
            return 'video/mp4'
        case ".mkv":
            return 'video/mkv'
        case ".mp3":
            return 'audio/mp3'
        default:
            return 'text/plain'
    }
}