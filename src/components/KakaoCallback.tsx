import { useEffect } from "react";
import axios from "axios";
import { useLoginContext } from "../context";
import { useNavigate } from "react-router-dom";
import { log } from "console";

const KakaoCallback = () => {
  const navigate = useNavigate();
  const login = useLoginContext();
  useEffect(() => {
    const params = new URL(document.location.toString()).searchParams;
    const code = params.get("code");
    const grantType = "authorization_code";
    const REST_API_KEY = "0f629ed49497e313bee6370f6f7d7f3a";
    const REDIRECT_URI = `http://localhost:3000/oauth`;

    const getUserInfo = async () => {
      const userName: string = "";
      try {
        const tokenResponse = await axios.post(
          `https://kauth.kakao.com/oauth/token`,
          `grant_type=${grantType}&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&code=${code}`,
          {
            headers: {
              "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
            },
          }
        );

        console.log(tokenResponse);
        const { access_token } = tokenResponse.data;

        const userInfoResponse = await axios.post(
          `https://kapi.kakao.com/v2/user/me`,
          {},
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
            },
          }
        );
        login.updateLoginInfo(userInfoResponse.data.properties.nickname);
        navigate("/");
        console.log("2번째", userInfoResponse);
      } catch (error) {
        console.log(error);
        const navigateOptions = {
          replace: true, // 뒤로 가기를 눌렀을 때 이전 페이지로 돌아가지 않음
          state: {
            message: "로그인에 실패하였습니다.\n다시 시도해주시길 바랍니다.",
          }, // 다음 페이지로 전달할 상태
        };
        navigate("/login", navigateOptions);
      }
    };

    getUserInfo();
  }, []);

  return <>kakao callback</>;
};
export default KakaoCallback;
