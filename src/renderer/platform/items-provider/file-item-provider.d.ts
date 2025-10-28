import { FileItem } from "@/renderer/items-provider/items"
import { JSX } from "react"
import { Column } from "virtual-table-react"

export const appendPath: (path: string, subPath: string) => string
export const getColumns: () => Column[]
export const renderRow: (item: FileItem) => (string|JSX.Element)[]
export const sortVersion: (a: FileItem, b: FileItem) => 1 | -1 | 0