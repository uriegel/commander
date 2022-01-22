import { EXTERNAL_TYPE, EXTERNAL_PATH, getExternal } from "./external.js"
import { EXTERNALS_PATH, EXTERNALS_TYPE, getExternals } from "./externals"
import { DIRECTORY_TYPE, getDirectory } from "./directory.js"
import { getRoot, ROOT, ROOT_PATH } from "./root.js"

export const getProcessor = (folderId, path, recentProcessor) => {

    if (!path)
        path = ROOT

    if (path == ROOT_PATH) {
        if (recentProcessor && recentProcessor.getType() == ROOT)
            return {
                processor: recentProcessor, 
                changed: false
            }
        else
            return {
                processor: getRoot(folderId), 
                changed: true
            }
    } else if (path == EXTERNALS_PATH || path == EXTERNAL_PATH) {
        if (recentProcessor && recentProcessor.getType() == EXTERNALS_TYPE) 
            return {
                processor: recentProcessor, 
                changed: false
            }
        else
            return {
                processor: getExternals(folderId), 
                changed: true
            }
    } else if (path.startsWith(EXTERNAL_PATH)) {
        if (recentProcessor && recentProcessor.getType() == EXTERNAL_TYPE) 
            return {
                processor: recentProcessor, 
                changed: false
            }
        else
            return {
                processor: getExternal(folderId, path), 
                changed: true
            }
    } else {
        if (recentProcessor && recentProcessor.getType() == DIRECTORY_TYPE) 
            return {
                processor: recentProcessor, 
                changed: false
            }
        else
            return {
                processor: getDirectory(folderId, path), 
                changed: true
            }
    }
}

  