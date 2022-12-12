import "./components/pdfviewer"
import { PdfViewer } from "./components/pdfviewer"
const viewerSplitter = document.getElementById('viewerSplitter')!
const viewerImg = document.getElementById('viewerImg')! as HTMLSourceElement
const viewerPdf = document.getElementById('viewerPdf')! as PdfViewer
const viewerVideo = document.getElementById('viewerVideo')! as HTMLVideoElement

export function showViewer(show?: boolean, path?: string) {
    if (show == undefined)
        show = !viewerActive
    viewerActive = show
    viewerSplitter.setAttribute("secondInvisible", show == true ? "false" : "true")
    if (show && path) 
        refresh(path)
    else {
        viewerImg.src = ""
        viewerVideo.src = ""
    }
}

export const refreshViewer = (path: string) => {
    if (viewerActive) {
        if (viewerRefresher)
            clearTimeout(viewerRefresher)
        viewerRefresher = setTimeout(() => {
            viewerRefresher = 0
            refresh(path)
        }, 50) as any as number
    }
}

const refresh = (path: string) => {
    const extPos = path.lastIndexOf(".")
    const ext = extPos != -1 ? path.substr(extPos+1).toLowerCase() : ""
    switch (ext) {
        case "png":
        case "jpg":
            viewerPdf.classList.add("hidden")
            viewerVideo.classList.add("hidden")
            viewerImg.classList.remove("hidden")
            viewerImg.src = `commander/${path.startsWith("android") ? "androidimage" : "image"}?path=${path}&nochache=${nocache++}` 
            viewerVideo.src = ""
            break
        case "pdf":
            viewerImg.classList.add("hidden")
            viewerVideo.classList.add("hidden")
            viewerPdf.classList.remove("hidden")
            viewerPdf.load(`commander/${path.startsWith("android") ? "androidfile" : "file"}?path=${path}`) 
            viewerVideo.src = ""
            break
        case "mp3":
        case "mp4":
        case "mkv":
        case "wav":
            viewerPdf.classList.add("hidden")
            viewerImg.classList.add("hidden")
            viewerVideo.classList.remove("hidden")
            viewerVideo.src = `commander/${path.startsWith("android") ? "androidmovie" : "movie"}?path=${path}` 
            break
        default:
            viewerVideo.classList.add("hidden")
            viewerImg.classList.add("hidden")
            viewerPdf.classList.add("hidden")
            viewerVideo.src = ""
            break
    }
}

var viewerActive = false
var viewerRefresher = 0
var nocache = 0
