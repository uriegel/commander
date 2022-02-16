import { RESULT_CANCEL } from "web-dialog-box"
import { EXTERN } from "../processors/root.js"
import { copyProcessor } from "../processors/copyProcessor.js"
import { EXTERNALS_PATH } from "../processors/externals.js"
const { homedir } = window.require('os')
const { exec } = window.require("child_process")
const { trashFile } = window.require('rust-addon')
const { copyFile } = window.require('shared-module')
const FileResult = window.require('shared-module').FileResult

export const onEnter = (fileName, path) => {
    const file = path + '/' + fileName
    try {
        fs.accessSync(file, fs.constants.X_OK)
        exec(file)
    } catch {
        exec(`xdg-open '${file}'`)
    }
    
}

