const { FileResult } = require("filesystem-utilities")

const composeFunction = (...fns) => (...args) => fns.reduceRight((acc, fn) => fn(acc), args)
const isLinux = process.platform == "linux"

const runCmd = async input => {
    const response = await fetch("http://runcmd", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    })
    const res = await response.json()
    if (res.result)
        throw (res)
}
