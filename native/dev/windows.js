import { getFiles } from "native"

const files = await getFiles("c:\\")
console.log("files", files)