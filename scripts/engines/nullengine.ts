import { Engine } from "./engines"

export class NullEngine implements Engine {
    async getItems(path: string|null|undefined, showHiddenItems?: boolean) {}
}