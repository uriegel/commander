import { app, protocol } from "electron"
import { exec } from 'child_process'
import path from "path"
import { rootDir } from "./index.js"
import { getIcon, getIconFromName } from "filesystem-utilities"

export function registerGetIconProtocol() {
    protocol.handle('icon', async (request) => {
        const url = new URL(request.url)
        const iconName = url.pathname.slice(1) || "ddd"// e.g. icon://folder.png → 'folder.png'
        const data = url.hostname == "name"
            ? await getIconFromName(iconName) //await readFile((await runCmd(`python3 ${iconFromNameScript} ${iconName}`)).trimEnd()) 
            : await getIcon(iconName)

        if (data.length == 0)
            console.log("icon not found", iconName)

        // Optional: you can store last-modified info in memory or on disk
        // const lastModified = getLastModifiedTimeForIcon(iconName)
        // const ifModifiedSince = request.headers.get('if-modified-since')

        // // Compare modification times
        // if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified)) {
        //     return new Response(null, { status: 304 })
        // }
        
        try {
            return new Response(data as any, {
                headers: {
                    'Content-Type': isSvg(data) ? 'image/svg+xml' : 'image/png',
                    'Content-Length': `${data.length}`,
//                    'Last-Modified': lastModified,
                    'Cache-Control': 'public, max-age=3600'
                }
            })
        } catch (err) {
            console.error('Failed to load icon', err)
            return new Response('Icon not found', { status: 404 })
        }
    })
}

function isSvg(bufferLike: Buffer<ArrayBufferLike> ) {
  const bytes = bufferLike instanceof ArrayBuffer
    ? new Uint8Array(bufferLike)
    : new Uint8Array(bufferLike.buffer || bufferLike);

  // Decode a small portion to avoid full parsing large files
  const header = new TextDecoder().decode(bytes.slice(0, 200)).trimStart();
  return header.startsWith('<svg') || header.startsWith('<?xml') && header.includes('<svg');
}

