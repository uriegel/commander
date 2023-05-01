export { }

declare global {
    interface String {
        appendPath(subPath: string): string 
        getExtension(): string
        extractSubPath(): string
        getParentPath(): string
        sideEffect(sideEffect: (s: string) => void): string
        parseInt(): number|null
    }

    interface Array<T> {
        sideEffectForEach(sideEffect: (t: T)=>void): T[]
        insert(index: number, t: T): T[]
        contains(t: T): boolean
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
String.prototype.parseInt = function (): number|null {
    var result = Number.parseInt(this as string)
    return Number.isNaN(result)
    ? null
    : result
}

// eslint-disable-next-line
Array.prototype.sideEffectForEach = function<T> (sideEffect: (t: T)=>void): T[] {
    this.forEach(sideEffect)
    return this 
}

// eslint-disable-next-line
Array.prototype.insert = function<T> (index: number, t: T): T[] {
    return [...this.slice(0, index),
        t,
        ...this.slice(index)
    ]
}

// eslint-disable-next-line
Array.prototype.contains = function <T>(t: T): boolean {
    return this.find(n => n === t)
}

