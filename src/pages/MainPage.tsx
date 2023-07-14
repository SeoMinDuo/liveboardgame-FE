import { redirect, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLoginContext } from "../context";

function MainPage() {
    const login = useLoginContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
        }
    }, [login, navigate]);
    return (
        <div className="bg-myWhite h-screen flex justify-center items-center flex-col">
            <div>{login.loginInfo.id}</div>
        </div>
    );
}

export default MainPage;
