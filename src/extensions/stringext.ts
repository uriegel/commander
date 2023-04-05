export { }

String.prototype.substringAfter = function (startChar: string): string {
    const posStart = this?.indexOf(startChar) + 1 ?? -1
    return posStart != -1 && posStart < this.length - 1
    ? this.substring(posStart)
    : ""
}

String.prototype.substringUntil = function (endChar: string): string {
    const posEnd = this?.indexOf(endChar) ?? 0
    return posEnd > 0
    ? this.substring(0, posEnd)
    : this as string ?? ""
}

String.prototype.stringBetween = function (startChar: string, endChar: string): string {
    return this
        ?.substringAfter(startChar)
        ?.substringUntil(endChar)
        ?? "";
}