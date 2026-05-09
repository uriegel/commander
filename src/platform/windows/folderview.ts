import { onEnter } from "../../requests/requests"

export const windowsOpenWith = async (name: string, path: string) => onEnter(name, path, true)