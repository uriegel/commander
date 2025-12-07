import { getFiles, getDrives } from "native"

const files = await getFiles("c:\\")
console.log("files", files)

const drives = await getDrives("c:\\")
console.log("drives", drives)