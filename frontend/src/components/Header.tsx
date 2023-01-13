import { FaSignInAlt, FaSignOutAlt, FaUser, FaHome } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { logout, reset } from "../features/auth/authSlice";


function Header() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { currentPlaylist } = useAppSelector(state => state.playlists)
    const { user } = useAppSelector(state => state.auth);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate("/register");
    }

    return (
        <header className="header">
            <div className="logo">
                <Link to="/">MuZap</Link>
            </div>
            {/* <p className="middle-text">{user?.name}</p> */}
            <ul>
                {user ? (
                    <>
                        <li>
                            {currentPlaylist &&
                                <Link to={"/"}>
                                    <FaHome /> Dashboard
                                </Link>
                            }
                        </li>
                        <li>
                            <Link to={"/login"} onClick={onLogout}>
                                <FaSignOutAlt /> Logout
                            </Link>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <Link to="/login">
                                <FaSignInAlt /> Login
                            </Link>
                        </li>
                        <li>
                            <Link to="/register">
                                <FaUser /> Register
                            </Link>
                        </li></>)
                }

            </ul >
        </header >
    )
}

export default Header