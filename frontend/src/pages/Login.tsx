import React, { useState, useEffect } from "react";
import { FaSignInAlt } from "react-icons/fa";
// import { useSelector, useDispatch } from "react-redux";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login, reset } from "../features/auth/authSlice";
import Spinner from "../components/Spinner";
import { UserData } from "../features/auth/authService";

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { user, isLoading, isError, isSuccess, message } = useAppSelector(state => state.auth);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
        if (isSuccess && user) {
            navigate("/");
        }

        dispatch(reset);
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }))
    }
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const userData:UserData = {
            name: undefined,
            email,
            password
        }

        dispatch(login(userData));
    }

    if (isLoading) {
        return <Spinner />
    }

    return (
        <>
            <section className="heading">
                <h1>
                    <FaSignInAlt />
                </h1>
                <p>Login and start listening</p>
            </section>
            <section className="form">
                <form onSubmit={onSubmit}>

                    <div className="from-group">
                        <input
                            type={"email"}
                            className="form-control"
                            id="email"
                            name="email"
                            value={email}
                            placeholder="Enter your email"
                            onChange={onChange}
                        />
                    </div>
                    <div className="from-group">
                        <input
                            type={"password"}
                            className="form-control"
                            id="password"
                            name="password"
                            value={password}
                            placeholder="Enter your password"
                            onChange={onChange}
                        />
                    </div>
                    <div className="form-group">
                        <button type="submit" className="btn btn-block">Submit</button>
                    </div>
                </form>
            </section>
        </>
    )
}

export default Login