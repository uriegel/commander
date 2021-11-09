const fspath = window.require('path')
const getExifDate = window.require('filesystem-utilities').getExifDate
const getFileVersion = window.require('filesystem-utilities').getFileVersion
const trash = window.require('filesystem-utilities').trash

export const adaptWindow = (menu, itemHideMenu) => itemHideMenu.isHidden = true

export function onDarkTheme(dark) {
    activateClass(document.body, "windows-dark", dark) 
    activateClass(document.body, "windows", !dark) 
}

export const adaptRootColumns = columns => columns

export function adaptDirectoryColumns(columns) {
    return [
        ...columns.slice(0, 3), {
            name: "Version",
            isSortable: true,
            render: (td, item) => {
                if (item.version)
                    td.innerHTML = `${item.version.major}.${item.version.minor}.${item.version.patch}.${item.version.build}`
            }
        }
    ]
}

export const getRootPath = item => [ item.name, null ]

export const pathDelimiter = "\\"

export const parentIsRoot = currentPath => currentPath.length == 3 && currentPath[1] == ':'

export const adaptDisableSorting = (table, disable) => table.disableSorting(3, disable)

export async function addExtendedInfo(item, path) {
    var name = item.name.toLocaleLowerCase();
    if (name.endsWith(".exe") || name.endsWith(".dll"))
        item.version = await getFileVersion(fspath.join(path, item.name))
    else if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))
        item.exifTime = await getExifDate(fspath.join(path, item.name))
}

export async function deleteItems(items) {
    await trash(items)
}   

export async function copyItems(sourcePath, targetPath, items) {
    console.log("Kopeire", sourcePath, targetPath, items)
}
    // }=> platformCopyItems(sourcePath,items.map(n => fspath.join(currentPath, n)))
//     id: getInactiveFolder().id,
//     sourcePath: activeFolder.getCurrentPath(),
//     destinationPath: path,
//     directories: itemsToCopy.filter(n => n.isDirectory).map(n => n.name),
//     files: itemsToCopy.filter(n => !n.isDirectory).map(n => n.name)
