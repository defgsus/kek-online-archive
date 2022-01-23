import {useLocation} from "react-router";
import {useDispatch} from "react-redux";
import {push} from "@lagunovsky/redux-react-router";
import "./Header.scss";


const KEK_URL = "https://www.kek-online.de/medienkonzentration/mediendatenbank#/";
const GITHUB_URL = "https://github.com/defgsus/kek-online-archive";


const Header = () => {
    const
        dispatch = useDispatch(),
        location = useLocation();

    return (
        <div className={"header"}>
            <div className={"grid-x"}>
                {location.pathname.length > 1
                    ? (
                        <div
                            className={"back"}
                            onClick={() => dispatch(push("/"))}
                        >←</div>
                      )
                    : null
                }
                <div className={"title grow"}>
                    media ownership in germany (data by <a href={KEK_URL} target={"_blank"}>kek-online.de</a>)
                </div>
                <div>
                    <a href={GITHUB_URL} target={"_blank"}>github</a>
                </div>
            </div>
        </div>
    )
};


export default Header;
