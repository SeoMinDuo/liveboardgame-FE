import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLoginContext } from "../context";
import { connect, subscribe, send, disconnect } from "../stomp";
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
            send("/app/sendMessage", { text: inputMessage });
            setInputMessage("");
        }
    };

    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
        }
    }, [login, navigate]);
    useEffect(() => {
        connect(); // 컴포넌트 마운트 시 WebSocket 연결

        const subscription = subscribe("/topic/messages", (newMessage: any) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        return () => {
            subscription.unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
            disconnect(); // 컴포넌트 언마운트 시 WebSocket 연결 해제
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
                                    <li key={index}>{message.text}</li>
                                ))}
                            </ul>
                            <div>
                                <input type="text" value={inputMessage} onChange={handleInputChange} />
                                <button onClick={handleSendMessage}>Send</button>
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
