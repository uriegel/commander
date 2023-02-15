export enum Platform {
    Windows,
    Linux
}

export const getPlatform = memoize(() => {
    const platform = new URLSearchParams(window.location.search).get("platform")
    return platform == "windows"
        ? Platform.Windows
        : platform == "linux"
        ? Platform.Linux
        // HACK set platform in browser react test 
        : Platform.Linux
})
    
function memoize<T>(funcToMemoize: ()=>T) {
    let memoized: T|null = null
    return () => {
        if (!memoized)
            memoized = funcToMemoize()
        
        console.log("memoized", memoized)
        
        return memoized
    }       
}

export const lastIndexOfAny = (str: string, chars: string[]): number => {
    if (chars.length > 0) {
        const res = str.lastIndexOf(chars[0])
        return res != -1
            ? res + 1
            : lastIndexOfAny(str, chars.slice(1))
    } else 
        return -1
}
    
