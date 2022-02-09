export const getExternals = folderId => {
    const deleteItems = itemsToDelete => {
        items = items.filter(n => !itemsToDelete.includes(n.name))
        localStorage.setItem("externals", JSON.stringify(items))
    }
}
