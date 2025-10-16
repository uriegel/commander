export const appendPath = (path: string, subPath: string) => {
    return path.endsWith("/") || subPath.startsWith('/')
        ? path + subPath
        : path + "/" + subPath
}