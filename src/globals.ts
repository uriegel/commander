export enum Platform {
    Windows,
    Linux
}

export const getPlatform = memoize(() => 
    new URLSearchParams(window.location.search).get("platform") == "windows"
    ? Platform.Windows
    : Platform.Linux
)
    
function memoize<T>(funcToMemoize: ()=>T) {
    let memoized: T|null = null
    return () => {
        if (!memoized)
            memoized = funcToMemoize()
        
        console.log("memoized", memoized)
        
        return memoized
    }       
}