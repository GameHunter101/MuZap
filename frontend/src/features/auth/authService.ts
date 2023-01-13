import axios from "axios";

export interface User {
    _id: string,
    name: string,
    email: string,
    token: string
}

export interface UserData {
    name: string | void,
    email:string,
    password: string
}

const API_URL = "/api/users"

// Register user
const register = async (userData: UserData) => {
    const response = await axios.post<User>(API_URL, userData);

    if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
    }

    return response.data
}

// Login user
const login = async (userData: UserData) => {
    const response = await axios.post<User>(API_URL + "/login", userData);

    if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
    }

    return response.data
}

// Logout user
const logout = () => {
    localStorage.removeItem("user");
}


const authService = {
    register,
    logout,
    login
}
export default authService