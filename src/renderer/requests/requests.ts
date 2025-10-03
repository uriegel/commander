export const cmdRequest = async (cmd: string) => await fetch(`cmd://${cmd}`, { method: 'POST' })

export const jsonRequest = async (cmd: string, msg: any) => {
    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
    }
    const response = await fetch(`json://${cmd}`, payload)
}