import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useLoginContext } from "../context";
import StompService from "../stomp";
import axios from "axios";

const stomp = new StompService();
function GamePage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState<string>("");
    const [matchingState, setMatchingState] = useState(true);
    let stopFinding = useRef(false);
    const login = useLoginContext();
    const navigate = useNavigate();

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setInputMessage(event.target.value);
    };

    const handleSendMessage = (): void => {
        if (inputMessage.trim() !== "") {
            stomp.send("/app/sendMessage", { text: inputMessage });
            setInputMessage("");
        }
    };
    const checkSubscribe = (): void => {
        if (stomp.isSubscribed()) {
            alert("구독중");
        } else {
            alert("구독중 아님");
        }
    };
    const handleNewMessage = (newMessage: string) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    };
    const setupStomp = async (roomId: string) => {
        try {
            await stomp.connect(); // WebSocket 연결 완료 대기
            stomp.subscribe("/topic/" + roomId, (newMessage: any) => {
                handleNewMessage(newMessage.content); // 새 메시지를 받았을 때 처리
            });
            if (localStorage.getItem("isConnected") == null || localStorage.getItem("isConnected") === "false") {
                localStorage.setItem("isConnected", "true");
            }
        } catch (error) {
            console.error("WebSocket 연결 실패:", error);
        }
    };
    const getRoomId = async (): Promise<string> => {
        try {
            const res = await axios.get("http://localhost:8080/roomId", {
                params: { XXXID: "123" },
            });
            const roomId: string = res.data.roomId;

            return roomId;
        } catch (err) {
            console.log("현재 방이 없습니다. 5초 뒤 다시 시도합니다.");

            await new Promise((resolve) => setTimeout(resolve, 5000));
            return !stopFinding.current ? getRoomId() : Promise.reject("Component umounted"); // 재귀 호출로 다시 함수를 실행합니다.
        }
    };

    const setMatch = async () => {
        let roomId = await getRoomId().catch((err) => {
            console.log(err);
        });
        if (roomId) await setupStomp(roomId);
        setMatchingState(false); // 매칭 완료
    };

    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
        }
    }, [login, navigate]);

    useEffect(() => {
        setMatch();

        return () => {
            localStorage.setItem("isConnected", "false");
            stomp.unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
            stomp.disconnect(); // 컴포넌트 언마운트 시 WebSocket 연결 해제
            stopFinding.current = true;
        };
    }, []);

    return (
        <div>
            {login.loginInfo.isLogin ? (
                <div className="bg-myWhite h-screen flex justify-center items-center flex-col">
                    <div>
                        <h1>STOMP WebSocket Example</h1>
                        {matchingState ? <div>매칭중</div> : <div>매칭완료</div>}
                        <div>
                            <ul>
                                {messages.map((message, index) => (
                                    <li key={index}>{message}</li>
                                ))}
                            </ul>
                            <div>
                                <input type="text" value={inputMessage} onChange={handleInputChange} />
                                <button onClick={handleSendMessage}>Send</button>
                                <button onClick={checkSubscribe} className="ml-5">
                                    구독 체크
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div></div>
            )}
        </div>
    );
}

export default GamePage;
