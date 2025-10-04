import { app, protocol } from "electron"
import { exec } from 'child_process'
import { getIcon } from "filesystem-utilities"
import path from "path"
import { rootDir } from "./index.js"

export function registerGetIconProtocol() {
    const isDev = !app.isPackaged
    const iconFromNameScript = isDev  
        ? path.join(rootDir, '..', '..', 'python', 'iconFromName.py')
        : path.join(process.resourcesPath, 'python', 'iconFromName.py');

    protocol.handle('icon', async (request) => {
        const url = new URL(request.url)
        const iconName = url.pathname.slice(1) // e.g. icon://folder.png → 'folder.png'

        const icon1 = (await runCmd(`python3 ${iconFromNameScript} ${iconName}`)).trimEnd()
        console.log("icon", icon1)


        // Optional: you can store last-modified info in memory or on disk
        // const lastModified = getLastModifiedTimeForIcon(iconName)
        // const ifModifiedSince = request.headers.get('if-modified-since')

        // // Compare modification times
        // if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified)) {
        //     return new Response(null, { status: 304 }) 
        // }

        try {
            const icon = await getIcon(iconName) 
            return new Response(icon as any, {
                headers: {
                    'Content-Type': 'image/svg+xml',
//                    'Last-Modified': lastModified,
                    //'Cache-Control': 'public, max-age=3600'
                }
            })
        } catch (err) {
            console.error('Failed to load icon', err)
            return new Response('Icon not found', { status: 404 })
        }
    })
}

const runCmd = (cmd: string):Promise<string> => new Promise(res => exec(cmd, (_, stdout) => res(stdout)))