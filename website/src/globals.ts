export enum Platform {
    Windows,
    Linux
}

export const isWindows = memoize(() => navigator.platform.startsWith("Win"))

export const getPlatform = memoize(() => {
    //const platform = new URLSearchParams(window.location.search).get("platform")
    return isWindows () // "windows"
        ? Platform.Windows
        : Platform.Linux
})

export const getPort = memoize(() => {
    // TODO let ret = new URLSearchParams(window.location.search).get("port")
    let ret = 8000
    console.log("Port", ret)
    return ret
})

function memoize<T>(funcToMemoize: () => T) {
    let memoized: T|null = null
    return () => {
        if (!memoized)
            memoized = funcToMemoize()
        return memoized
    }       
}

