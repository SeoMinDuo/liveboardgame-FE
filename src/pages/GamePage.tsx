import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLoginContext } from "../context";
import io, { Socket } from "socket.io-client";
function GamePage() {
    const [message, setMessage] = useState("");
    const [receivedMessage, setReceivedMessage] = useState("");
    const socketRef = useRef<Socket | undefined>();

    const login = useLoginContext();
    const navigate = useNavigate();
    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
        }
    }, [login, navigate]);
    useEffect(() => {
        // 소켓 연결 생성
        socketRef.current = io("http://localhost:3001");

        // 소켓 이벤트 리스너 등록
        socketRef.current.on("connect", () => {
            console.log("Connected to the server");
        });

        socketRef.current.on("message", (message: string) => {
            setReceivedMessage(message);
        });

        socketRef.current.on("disconnect", () => {
            console.log("Disconnected from the server");
        });

        // 컴포넌트 언마운트 시 소켓 연결 종료
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (socketRef.current?.connected) {
            // 소켓 연결 상태를 확인하고 메시지 보내기
            socketRef.current.emit("message", message);
            setMessage("");
        } else {
            console.log("Socket is not connected");
            // 소켓 연결이 안정화되지 않았을 때에 대한 처리를 추가할 수 있습니다.
        }
    };
    return (
        <div>
            {login.loginInfo.isLogin ? (
                <div className="bg-myWhite h-screen flex justify-center items-center flex-col">
                    <div>
                        <h1>Socket.io Example</h1>
                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
                        <button onClick={sendMessage}>Send</button>
                        <p>Received message: {receivedMessage}</p>
                    </div>
                </div>
            ) : (
                <div></div>
            )}
        </div>
    );
}

export default GamePage;
