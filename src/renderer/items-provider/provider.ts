import { IItemsProvider } from "./base-provider"
import { RootItemProvider } from "./root-items-provider"

export const getItemsProvider: (path?: string) => IItemsProvider = () => {
    return new RootItemProvider()
}