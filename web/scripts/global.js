const composeFunction = (...fns) => (...args) => fns.reduceRight((acc, fn) => fn(acc), args)
const isLinux = process.platform == "linux"

const runCmd = async input => {
    const res = await fetch("http://runcmd", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    })
}
