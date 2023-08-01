import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLoginContext } from "../context";
import StompService from "../stomp";

const stomp = new StompService();
function GamePage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState<string>("");

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

    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
        }
    }, [login, navigate]);
    useEffect(() => {
        const setupStomp = async () => {
            try {
                await stomp.connect(); // WebSocket 연결 완료 대기
                stomp.subscribe("/topic/messages", (newMessage: any) => {
                    handleNewMessage(newMessage.content); // 새 메시지를 받았을 때 처리
                });
            } catch (error) {
                console.error("WebSocket 연결 실패:", error);
            }
        };
        if (localStorage.getItem("isConnected") == null || localStorage.getItem("isConnected") === "false") {
            localStorage.setItem("isConnected", "true");
            setupStomp();
        }
        setupStomp();
        return () => {
            localStorage.setItem("isConnected", "false");
            stomp.unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
            stomp.disconnect(); // 컴포넌트 언마운트 시 WebSocket 연결 해제
        };
    }, []);

    return (
        <div>
            {login.loginInfo.isLogin ? (
                <div className="bg-myWhite h-screen flex justify-center items-center flex-col">
                    <div>
                        <h1>STOMP WebSocket Example</h1>
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
