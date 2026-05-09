export const getViewerPath = (path: string) => 
    path.startsWith("remote")
    ? `http://${path.stringBetween("/", "/")}/getfile/${path.substringAfter("/").substringAfter("/")}`
    : `http://localhost:8080/file${path}`

