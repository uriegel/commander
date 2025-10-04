import { app, protocol } from "electron"
import { exec } from 'child_process'
import path from "path"
import { rootDir } from "./index.js"
import { readFile } from "fs/promises"

export function registerGetIconProtocol() {
    const isDev = !app.isPackaged
    const iconFromNameScript = isDev  
        ? path.join(rootDir, '..', '..', 'python', 'iconFromName.py')
        : path.join(process.resourcesPath, 'python', 'iconFromName.py');

    protocol.handle('icon', async (request) => {
        const url = new URL(request.url)
        const iconName = url.pathname.slice(1) // e.g. icon://folder.png → 'folder.png'
        const icon = (await runCmd(`python3 ${iconFromNameScript} ${iconName}`)).trimEnd()

        // Optional: you can store last-modified info in memory or on disk
        // const lastModified = getLastModifiedTimeForIcon(iconName)
        // const ifModifiedSince = request.headers.get('if-modified-since')

        // // Compare modification times
        // if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified)) {
        //     return new Response(null, { status: 304 }) 
        // }
        try {
            const data = await readFile(icon) 
            return new Response(data as any, {
                headers: {
                    'Content-Type': icon.toLowerCase().endsWith('svg') ? 'image/svg+xml' : 'image/png',
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

const runCmd = (cmd: string):Promise<string> => new Promise(res => exec(cmd, (_, stdout) => res(stdout)))