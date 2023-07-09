import { redirect, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLoginContext } from "../context";

function Main() {
    const login = useLoginContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
        }
    }, [login, navigate]);
    return (
        <div className="bg-red-500 w-screen h-screen">
            {login.loginInfo.id}
            <button
                className="bg-blue-300"
                onClick={() => {
                    redirect("/login");
                    login.updateLoginInfo("abc");
                }}
            >
                click
            </button>
        </div>
    );
}

export default Main;
