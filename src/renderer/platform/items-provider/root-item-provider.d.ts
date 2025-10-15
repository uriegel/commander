import { RootItem } from "@/renderer/items-provider/items"
import { JSX } from "react"
import { Column } from "virtual-table-react"

export const getColumns: () => Column[]
export const renderRow: (item: RootItem) => (string|JSX.Element)[]