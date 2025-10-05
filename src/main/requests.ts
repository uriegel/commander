import { getDrives, getFiles } from "filesystem-utilities"

type GetFiles = {
    path: string
}

export const onRequest = async (request: Request) => {
	if (request.method != 'POST') 
        return writeJson({ ok: false })
    switch (request.url) {
        case "json://getdrives/":
            const drives = await getDrives()
            return writeJson(drives)
        case "json://getfiles/":
            const getfiles = await request.json() as GetFiles
            const files = await getFiles(getfiles.path)
            return writeJson(files)
        default:
            return writeJson({ ok: false })
    }
}

function writeJson(msg: any) {
    return new Response(JSON.stringify(msg), {
        headers: { 'Content-Type': 'application/json' }
    })
}
