export const getViewerPath = (path: string) => 
    path.startsWith("remote")
    ? `http://${path.stringBetween("/", "/")}:8080/getfile/${path.substringAfter("/").substringAfter("/")}`
    : `bin://pics/${path}`
