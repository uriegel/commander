import { jsonRequest } from "../requests/requests"
import { IItemsProvider } from "./base-provider"

export class RootItemProvider extends IItemsProvider {
    async getItems(id: string): Promise<string> {

        // TODO compare reqId with reqId from the BaseProvider, if smaller cancel. Do this also after result

        await jsonRequest("getdrives", { })
        return "das sollen drives werden"
        
    }

    constructor() { super()}
}