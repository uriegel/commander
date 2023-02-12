import Folder from "../svg/Folder"

interface IconNameProps {
    namePart: string
}

const IconName = ({ namePart }: IconNameProps) => (
    <div>
        <Folder />
        <span>{namePart}</span>
    </div>
    
)

export default IconName