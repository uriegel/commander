export { }

declare global {
    interface String {
        appendPath(subPath: string): string 
        getExtension(): string
        extractSubPath(): string
        getParentPath(): string
    }
    interface Array<T> { 
        distinct(): T[] 
    }
    interface Date { 
        removeMilliseconds(): Date 
    }
    interface Number {
        byteCountToString(): string
    }
}

String.prototype.getExtension = function (): string {
    const index = this.lastIndexOf(".")
    return index > 0 ? this.substring(index) : ""
}

String.prototype.extractSubPath = function (): string {
    return this.substring(this.lastIndexOfAny(["/", "\\"]))
}

String.prototype.getParentPath = function (): string {
    return this.length > 1 && (this.charAt(this.length - 1) == "/" || this.charAt(this.length - 1) == "\\")
        ? this.substring(0, this.substring(0, this.length - 1).lastIndexOfAny(["/", "\\"]))
        : this.substring(0, this.lastIndexOfAny(["/", "\\"]))
}

String.prototype.appendPath = function (subPath: string): string {
    return this.endsWith("/")
        ? this + subPath
        : this + "/" + subPath
}

Array.prototype.distinct = function () {
    return [...new Set(this)]
}

Date.prototype.removeMilliseconds = function () {
    const newDate = new Date(this.getTime())
    newDate.setMilliseconds(0)
    return newDate
}

Number.prototype.byteCountToString = function () {
    const gb = Math.floor(this.valueOf() / (1024 * 1024 * 1024))
    const mb = this.valueOf() % (1024 * 1024 * 1024)
    if (gb >= 1.0)
        return `${gb},${mb.toString().substring(0, 2)} GB`
    const mb2 = Math.floor(this.valueOf() / (1024 * 1024))
    const kb = this.valueOf() % (1024 * 1024)
    if (mb2 >= 1.0)
        return `${mb2},${kb.toString().substring(0, 2)} MB`
    const kb2 = Math.floor(this.valueOf() / 1024)
    const b = this.valueOf() % 1024
    if (kb2 >= 1.0)
        return `${kb2},${b.toString().substring(0, 2)} KB`
    else
        return `${b} B`
}
