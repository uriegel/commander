export {};

declare global {
    interface Window {
        electronAPI: {
            onMessage: (callback: (data: unknown) => void) => void
            startDrag: (files: string[]) => void
        },
        env: {
            platform: string;
            getDropPath: (file: File) => string
        }
    }
}

export {}