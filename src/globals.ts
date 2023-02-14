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