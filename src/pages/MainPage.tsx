import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLoginContext } from "../context";

function MainPage() {
    const login = useLoginContext();
    const navigate = useNavigate();

    const goGame = async () => {
        navigate("/game");
    };
    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
        }
    }, [login, navigate]);

    return (
        <div className="bg-myWhite h-screen flex justify-center items-center flex-col">
            <div className="w-1/4 aspect-square bg-gray-900 rounded-3xl">{login.loginInfo.id}</div>
            <button
                className="rounded-full active:bg-sky-600 bg-sky-500 hover:bg-sky-400 py-1 mt-5 w-1/5 h-16 text-2xl"
                onClick={goGame}
            >
                매칭하기
            </button>
        </div>
    );
}

export default MainPage;
