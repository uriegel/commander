
export const ShowDevTools = "showdevtools"
type ShowDevToolsType = "showdevtools"
export type RequestType = ShowDevToolsType

type Empty = {}
export type RequestInput = Empty

export async function request(method: RequestType, input?: RequestInput) {
    const response = await fetch(`commander/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {})
    })
    const res = await response.json()
    if (res.exception)
        throw (res.exception)
}