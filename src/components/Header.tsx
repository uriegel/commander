import { isWindows } from "../globals"
import './Header.css'

interface HeaderProps {
    menu: JSX.Element
}

const Header = ({menu}: HeaderProps ) => {
    return  isWindows()        
        ? (<div className="header">
                <div>Test</div>
                {menu}
                <div className="headerGrip"></div>
            </div>)
        : menu
}

export default Header