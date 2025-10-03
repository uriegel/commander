export abstract class IItemsProvider {
    abstract getItems(id: string, path?: string, showHidden?: boolean, mount?: boolean) : Promise<string>
}

