import { Item, RootItem } from "../../items"
import { getDrives } from "../requests/requests"
import { IItemsProvider } from "./base-provider"

export class RootItemProvider extends IItemsProvider {
    async getItems(id: string) {

        // TODO compare reqId with reqId from the BaseProvider, if smaller cancel. Do this also after result

        return await getDrives()
    }

    constructor() { super()}
}