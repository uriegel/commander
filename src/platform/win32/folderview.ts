import { onEnter } from "../../requests/requests"

export const openWith = async (name: string, path: string) => onEnter(name, path, true)