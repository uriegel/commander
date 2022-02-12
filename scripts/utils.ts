export function activateClass(element: HTMLElement, cls: string, activate: boolean) {
    if (activate != false)
        element.classList.add(cls)
    else
        element.classList.remove(cls)
}

export const compose = <T1, T2, T3>(f: (x: T2)=>T3, g: (x:T1)=>T2) => (x: T1) => f(g(x))

export function curry2<T1, T2, T3>(fn: (a: T1, b: T2)=>T3) {
    return (a: T1) => (b: T2) => fn(a, b)
}

export function curry3<T1, T2, T3, T4>(fn: (a: T1, b: T2, c: T3)=>T4) {
    return (a: T1) => (b: T2) => (c: T3) => fn(a, b, c)
}

export function curry4<T1, T2, T3, T4, T5>(fn: (a: T1, b: T2, c: T3, d: T4)=>T5) {
    return (a: T1) => (b: T2) => (c: T3) => (d: T4) => fn(a, b, c, d)
}
