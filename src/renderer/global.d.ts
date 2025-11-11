export {};

declare global {
    interface Window {
        electronAPI: {
            onMessage: (callback: (data: unknown) => void) => void
        },
        env: {
            platform: string;
            getDropPath: (file: File) => string
        }
    }
}

export {}