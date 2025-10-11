export {};

declare global {
    interface Window {
        electronAPI: {
            onMessage: (callback: (data: unknown) => void) => void
        }
    }
}