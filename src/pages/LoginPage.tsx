import { useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginContext } from "../context";

type LoginInfo = {
  id: string;
  pw: string;
};
function LoginPage() {
  const [loginInfo, setLoginInfo] = useState<LoginInfo>({ id: "", pw: "" });
  const navigate = useNavigate();
  const login = useLoginContext();

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setLoginInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const goMain = async () => {
    //axios
    //if check ok
    login.updateLoginInfo(loginInfo.id);
    navigate("/");
  };
  
  return (
    <div className="bg-myWhite h-screen flex justify-center items-center flex-col">
      <div className="text-gray-900 text-[10vw] font-bold mb-5">
        뭉쳐야 산다
      </div>
      <input
        type="text"
        className="rounded-xl h-8 px-3 mb-3 focus:outline-none focus:ring focus:ring-gray-300 hover:ring hover:ring-gray-200"
        name="id"
        placeholder="ID"
        value={loginInfo.id}
        onChange={handleChange}
      />
      <input
        type="password"
        className="rounded-xl h-8 px-3 mb-3 focus:outline-none focus:ring focus:ring-gray-300 hover:ring hover:ring-gray-200"
        name="pw"
        placeholder="PW"
        value={loginInfo.pw}
        onChange={handleChange}
      />
      <button
        className="rounded-full active:bg-sky-600 bg-sky-500 hover:bg-sky-400 py-1 mb-3 w-36"
        onClick={goMain}
      >
        로그인
      </button>
      <button className="rounded-full active:bg-green-600 bg-green-600 hover:bg-green-500 py-1 mb-3 w-36">
        회원가입
      </button>
    </div>
  );
}

export default LoginPage;
