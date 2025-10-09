export type ErrorType = {
    code: number,
    msg: string
}

export function extractErrorFromException(e: unknown): ErrorType {
    const err = e as Error
    const parts = err.message.split("$$", 2)
    return { code: parseInt(parts[0]), msg: parts[1] };
}