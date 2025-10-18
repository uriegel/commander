import { FolderViewHandle } from "./components/FolderView"

export const copyItems = async (sourceFolder: FolderViewHandle | null, targetFolder: FolderViewHandle | null, move: boolean) => {
    if (sourceFolder == null || targetFolder == null)
        return
    const items = sourceFolder?.getSelectedItems()
    sourceFolder.refresh()
    targetFolder.refresh()


        // const defNo = prepareResult.conflicts.length > 0
        //     && prepareResult
        //         .conflicts
        //         .filter(n => (n.source.time ?? "") < (n.target.time ?? ""))
        //         .length > 0
        
        // const res = await dialog.show({
        //     text: controller.current.getCopyText(prepareResult, move),
        //     slide: fromLeft ? Slide.Left : Slide.Right,
        //     extension: prepareResult.conflicts.length ? CopyConflicts : undefined,
        //     extensionProps: prepareResult.conflicts.map(n => ({
        //         name: n.source.name.getFileName(),
        //         subPath: n.source.name.getParentPath(),
        //         iconPath: n.source.name,
        //         size: n.source.size,
        //         time: n.source.time,
        //         targetSize: n.target.size,
        //         targetTime: n.target.time
        //     }) as ConflictItem), 
        //     fullscreen: prepareResult.conflicts.length > 0,
        //     btnYes: prepareResult.conflicts.length > 0,
        //     btnNo: prepareResult.conflicts.length > 0,
        //     btnOk: prepareResult.conflicts.length == 0,
        //     btnCancel: true,
        //     defBtnYes: !defNo && prepareResult.conflicts.length > 0,
        //     defBtnNo: defNo
        // })
        // const result = await copy({ id, cancelled: res.result == ResultType.Cancel, notOverwrite: res.result == ResultType.No })
        // if (!result.cancelled) {
        //     inactiveFolder.refresh()
        //     if (move)
        //         refresh()
        // }
    }
