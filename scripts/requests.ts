 
export const ShowDevTools = "showdevtools"
export const ShowFullscreen = "showfullscreen"
type ShowDevToolsType = "showdevtools"
type ShowFullscreenType = "showfullscreen"
export type RequestType = ShowDevToolsType | ShowFullscreenType

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