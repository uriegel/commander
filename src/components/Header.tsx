import { isWindows } from "../globals"

interface HeaderProps {
    menu: JSX.Element
}

const Header = ({menu}: HeaderProps ) => {
    return  isWindows()        
        ? (<div>
            <div>Test</div>
                {menu}
        </div>)
        : menu
}

export default Header