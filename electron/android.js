const http = require('http')

async function run() {
    async function request(path) {
        const keepAliveAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 40000
        })

        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                path: "/home/uwe/media files",
                count: 234
            })
            const req = http.request({
                hostname: "192.168.178.42",
                port: 8080,
                path,
                agent: keepAliveAgent,
                timeout: 40000,
                method: 'POST',
                checkServerIdentity: function () {
                    console.log("checkServerIdentity")
                },
                headers: {
					'Content-Type': 'application/json; charset=UTF-8',
					'Content-Length': Buffer.byteLength(data)
				}            
            }, response => {
                response.setEncoding('utf8')
                response.on('data', chunk => {
                    const result = JSON.parse(chunk)
                    resolve(result)
                })
                response.on('end', () => {
                    // console.log('No more data in response.')
                })
            })        
            
            req.on('error', e => {
                console.log("error", "problem with request", e)
                reject(e)
            })
            req.write(data)
            req.end()        
        }) 
    }

    const test = await request("/postfiles")
    console.log(test)
}
run()