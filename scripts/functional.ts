export const compose = <T1, T2, T3>(f: (x: T2) => T3, g: (x: T1) => T2) => (x: T1) => f(g(x))

export function insertArrayItem<T> (arr: Array<T>, pos: number, t: T) {
    let firstArray = arr.slice(0, pos)
    let lastArray = arr.slice(pos, arr.length)
    return firstArray.concat([t], lastArray)
}

export function removeArrayItem<T> (arr: Array<T>, pos: number) {
    let firstArray = arr.slice(0, pos)
    let lastArray = arr.slice(pos + 1, arr.length)
    return firstArray.concat(lastArray)
}
