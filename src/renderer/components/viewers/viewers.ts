export const getViewerPath = (path: string, media?: boolean) => 
    path.startsWith("remote")
    ? `http://${path.stringBetween("/", "/")}/getfile/${path.substringAfter("/").substringAfter("/")}`
    : `${getScheme(media)}://local/${path}`

function getScheme(media?: boolean) {
    return media ? "media" : "bin"
}
