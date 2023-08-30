import kakaoImg from "../images/kakaoLogin.png";

function KakaoLogin() {
  const REST_API_KEY = "0f629ed49497e313bee6370f6f7d7f3a";
  const REDIRECT_URI = "http://localhost:3000/oauth";
  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  return (
    <img
      alt="카카오 로그인"
      src={kakaoImg}
      style={{ margin: "0px 24px 16px 24px", cursor: "pointer" }}
      onClick={() => (window.location.href = kakaoURL)}
      className="hover:brightness-105"
    />
  );
}
export default KakaoLogin;
