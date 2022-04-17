import { protocol } from "electron"
import { Platform } from "../platforms"
import { getIcon } from "rust-addon"
import { exec } from "child_process"
import path from 'path'
import fs from 'fs'

async function getKdeIcon(ext: string) {
    const runCmd = (cmd: string) => new Promise<string>(res => exec(cmd, (_, stdout) => res(stdout)))

    const getMimeScript = path.join(__dirname, '../../../../web/assets/getmime.py')
    const mimeType = await runCmd(`python3 ${getMimeScript} f${ext}`)
    let mime = extractMime(mimeType)
    if (mime == "/usr/share/icons/breeze/mimetypes/16/application-x-msdos-program.svg")
        mime = "/usr/share/icons/breeze/mimetypes/16/application-x-ms-dos-executable.svg"
    if (mime == "/usr/share/icons/breeze/mimetypes/16/application-java-archive.svg")
        mime = "/usr/share/icons/breeze/mimetypes/16/application-x-jar.svg"
    let icon = `/usr/share/icons/breeze/mimetypes/16/${mime}.svg`

    if (fs.existsSync(icon))
        return icon
    else
        return "/usr/share/icons/breeze/mimetypes/16/application-x-zerosize.svg"
    
    function extractMime(mime: string) {
        const pos1 = mime.indexOf("('")
        const pos2 = mime.indexOf("',")
        return pos1 != -1 && pos2 != -1
            ? (mime.substring(pos1+2, pos2)).replace("/", "-")
            : "application-x-zerosize"
    }
}

export class LinuxPlatform implements Platform {
    registerGetIconProtocol() {
        const isKde = process.env['DESKTOP_SESSION']?.startsWith("plasma") 

        protocol.registerFileProtocol('icon', async (request, callback) => {
            const url = request.url
            const ext = url.substring(7)
            const path = isKde ? await getKdeIcon(ext) : getIcon(ext) 
            callback(path)
        })
    }
    registerCommands() {}
}