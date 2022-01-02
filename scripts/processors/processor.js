import { DIRECTORY_TYPE, getDirectory } from "./directory.js"
import { getRoot, ROOT } from "./root.js"

export const getProcessor = (folderId, path, recentProcessor, onDragStart, onDrag, onDragEnd) => {

    if (!path)
        path = ROOT

    if (path == "root") {
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
    }
    else {
        if (recentProcessor && recentProcessor.getType() == DIRECTORY_TYPE) 
            return {
                processor: recentProcessor, 
                changed: false
            }
        else
            return {
                processor: getDirectory(folderId, path, onDragStart, onDrag, onDragEnd), 
                changed: true
            }
    }
}

  