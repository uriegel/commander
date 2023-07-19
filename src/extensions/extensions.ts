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
}

// eslint-disable-next-line
String.prototype.getExtension = function (): string {
    let index = this.lastIndexOf(".")
    return index > 0 ? this.substring(index) : ""
}

// eslint-disable-next-line
String.prototype.extractSubPath = function (): string {
    return this.substring(this.lastIndexOfAny(["/", "\\"]))
}

// eslint-disable-next-line
String.prototype.getParentPath = function (): string {
    return this.length > 1 && (this.charAt(this.length - 1) == "/" || this.charAt(this.length - 1) == "\\")
        ? this.substring(0, this.substring(0, this.length - 1).lastIndexOfAny(["/", "\\"]))
        : this.substring(0, this.lastIndexOfAny(["/", "\\"]))
}

// eslint-disable-next-line
String.prototype.appendPath = function (subPath: string): string {
    return this.endsWith("/")
        ? this + subPath
        : this + "/" + subPath
}

Array.prototype.distinct = function () {
    return [... new Set(this)]
}

Date.prototype.removeMilliseconds = function () {
    const newDate = new Date(this.getTime())
    newDate.setMilliseconds(0)
    return newDate
}
