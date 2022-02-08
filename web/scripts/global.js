const runCmd = async input => {
    const response = await fetch("http://runcmd", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    })
    const res = await response.json()
    if (res.exception)
        throw (res.exception)
}
