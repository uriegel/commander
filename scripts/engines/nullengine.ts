import { Engine, ItemResult } from "./engines"

export class NullEngine implements Engine {
    isSuitable(path: string|null|undefined) { return false }
    async getItems(path: string|null|undefined, showHiddenItems?: boolean) {
        return { items: [], path: "" } as ItemResult
    }
}