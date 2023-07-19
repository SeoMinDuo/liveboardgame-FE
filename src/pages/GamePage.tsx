import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLoginContext } from "../context";

function GamePage() {
    const login = useLoginContext();
    const navigate = useNavigate();

    
    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
        }
    }, [login, navigate]);

    return (
        <div className="bg-myWhite h-screen flex justify-center items-center flex-col">
            <div className="w-1/4 aspect-square bg-gray-900 rounded-3xl">{login.loginInfo.id}</div>
            <div className=""></div>
        </div>
    );
}

export default GamePage;
