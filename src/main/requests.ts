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
            return writeJson({ items: drives, path: "root" })
        case "json://getfiles/":
            const getfiles = await request.json() as GetFiles
            const items = await getFiles(getfiles.path)
            return writeJson({ items, path: getfiles.path })
        default:
            return writeJson({ ok: false })
    }
}

function writeJson(msg: any) {
    return new Response(JSON.stringify(msg), {
        headers: { 'Content-Type': 'application/json' }
    })
}
