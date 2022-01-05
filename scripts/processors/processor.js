import { ANDROID_TYPE, getAndroid } from "./android.js"
import { ANDROID_PATH, ANDROIDS_TYPE, getAndroids } from "./androids.js"
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
    } else if (path == ANDROID_PATH) {
        if (recentProcessor && recentProcessor.getType() == ANDROIDS_TYPE) 
            return {
                processor: recentProcessor, 
                changed: false
            }
        else
            return {
                processor: getAndroids(folderId), 
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

  