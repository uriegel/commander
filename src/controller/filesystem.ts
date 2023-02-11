import { GetItemResult, request } from "./requests"

export const getItems = async (path: string) => {
	return await request<GetItemResult>("getfiles", {
		path,
		showHiddenItems: true
	})
}