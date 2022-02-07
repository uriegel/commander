export const formatSize = size => {
    if (!size)
        return ""
    let sizeStr = size.toString()
    const sep = '.'
    if (sizeStr.length > 3) {
        var sizePart = sizeStr
        sizeStr = ""
        for (let j = 3; j < sizePart.length; j += 3) {
            const extract = sizePart.slice(sizePart.length - j, sizePart.length - j + 3)
            sizeStr = sep + extract + sizeStr
        }
        const strfirst = sizePart.substr(0, (sizePart.length % 3 == 0) ? 3 : (sizePart.length % 3))
        sizeStr = strfirst + sizeStr
    }
    return sizeStr    
}


export const compareVersion = (versionLeft, versionRight) =>
    !versionLeft
    ? -1
    : !versionRight
    ? 1
    : versionLeft.major != versionRight.major 
    ? versionLeft.major - versionRight.major
    : versionLeft.minor != versionRight.minor
    ? versionLeft.minor - versionRight.minor
    : versionLeft.patch != versionRight.patch
    ? versionLeft.patch - versionRight.patch
    : versionLeft.build - versionRight.build
