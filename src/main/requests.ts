import { getDrives } from "filesystem-utilities"

export const onRequest = async (request: Request) => {
	if (request.method != 'POST') 
        return writeJson({ ok: false })
    switch (request.url) {
        case "json://getdrives/":
            const text = await request.text()
            
            // TODO to requsts.ts
            var drives = await getDrives()
					
            // const files = await getFiles("/home/uwe")
            // console.log("files", files)

            // var buffer = await getIcon(".wav")
		
            // console.log("Buffer", buffer.length)


            return writeJson(drives)
        default:
            return writeJson({ ok: false })
    }
}

function writeJson(msg: any) {
    return new Response(JSON.stringify(msg), {
        headers: { 'Content-Type': 'application/json' }
    })
}
