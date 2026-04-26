export const getViewerPath = (path: string, media?: boolean) => 
    path.startsWith("remote")
    ? `http://${path.stringBetween("/", "/")}/getfile/${path.substringAfter("/").substringAfter("/")}`
    : `http://localhost:8080/image${path}`

function getScheme(media?: boolean) {
    return media ? "media" : "bin"
}
