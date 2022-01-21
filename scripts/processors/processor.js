import { ANDROID_TYPE, ANDROID_PATH, getAndroid } from "./android.js"
import { EXTERNAL_PATH, EXTERNAL_TYPE, getExternals } from "./external"
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
    } else if (path == EXTERNAL_PATH || path == ANDROID_PATH) {
        if (recentProcessor && recentProcessor.getType() == EXTERNAL_TYPE) 
            return {
                processor: recentProcessor, 
                changed: false
            }
        else
            return {
                processor: getExternals(folderId), 
                changed: true
            }
    } else if (path.startsWith(ANDROID_PATH)) {
        if (recentProcessor && recentProcessor.getType() == ANDROID_TYPE) 
            return {
                processor: recentProcessor, 
                changed: false
            }
        else
            return {
                processor: getAndroid(folderId, path), 
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

  