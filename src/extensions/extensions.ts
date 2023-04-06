export { }

declare global {
    interface String {
        appendPath(subPath: string): string 
        getExtension(): string
        extractSubPath(): string
        getParentPath(): string
        sideEffect(sideEffect: (s: string)=>void): string
    }

    interface Array<T> {
        sideEffectForEach(sideEffect: (t: T)=>void): T[]
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

// eslint-disable-next-line
String.prototype.sideEffect = function (sideEffect: (s: string)=>void): string {
    sideEffect(this as string)
    return this as string
}

// eslint-disable-next-line
Array.prototype.sideEffectForEach = function<T> (sideEffect: (t: T)=>void): T[] {
    this.forEach(sideEffect)
    return this 
}
