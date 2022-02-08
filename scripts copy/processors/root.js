import { formatSize } from "./rendertools.js"
import { adaptRootColumns, getRootPath, getDrives } from '../platforms/switcher.js'

export const ROOT = "root"
export const ROOT_PATH = "root"
export const EXTERN = "extern"

export const getRoot = folderId => {
    const getType = () => ROOT

    const addExtendedInfos = () => []

    const createFolder = async () => { }

    const disableSorting = () => {}

    const onEnter = () => {}
}