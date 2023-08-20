import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useLoginContext } from "../context";
import LoadingCircle from "../components/LoadingCircle";
import GameBoard from "../components/GameBoard";
import StompService from "../stomp";
import axios from "axios";
import { log } from "console";

type Pos = {
    x: number;
    y: number;
};
const stomp = new StompService();
function GamePage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState<string>("");
    const [isMatchingState, setIsMatchingState] = useState(true);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [time, setTime] = useState(0);
    const [isMyTurn, setIsMyTurn] = useState(false);

    let roomId = useRef("-1");
    let stopFinding = useRef(false);
    const login = useLoginContext();
    const navigate = useNavigate();

    // GameBoard
    const initialBoardData: string[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ""));

    const boardData = useRef<string[][]>([...initialBoardData]);

    const [tempBoardData, setTempBoardData] = useState<string[][]>(initialBoardData);

    const [pos, setPos] = useState<Pos>();

    const handleCellClick = (x: number, y: number) => {
        console.log("handleCellClick");

        if (isMyTurn === false) return;

        const newBoardData = [...boardData.current];
        if (newBoardData[y][x] === "") newBoardData[y][x] = "ME"; // 예시로 X 말 추가
        setPos({ x, y });
        setTempBoardData(newBoardData);
    };

    const sendNewPosition = () => {
        console.log("sendNewPosition");

        setIsMyTurn(false);
        boardData.current = [...tempBoardData];
        stomp.send("/app/gameboard/" + roomId.current, { x: pos?.x, y: pos?.y, name: login.loginInfo.id });
    };

    const updateBoard = (x: number, y: number, own: string) => {
        console.log("updateBoard");

        if (own === login.loginInfo.id) setIsMyTurn(false); // 내가 이미 배치한 내용
        else {
            // 상대가 배치한 내용
            const newBoardData = [...boardData.current];
            newBoardData[y][x] = "YOU";
            setIsMyTurn(true);
            boardData.current = newBoardData;
            setTempBoardData(newBoardData);
        }
    };

    // stomp 메세지 수신 구독 중인지 확인하는 함수
    const checkSubscribe = (): void => {
        if (stomp.isSubscribed()) {
            alert("구독중");
        } else {
            alert("구독중 아님");
        }
    };

    // stomp 연결, stomp 메세지 수신 구독
    const setupStomp = async () => {
        try {
            // 소켓 연결
            await stomp.connect();

            // 새로운 말 배치 수신 구독
            stomp.subscribe("/topic/gameboard/" + roomId.current, (newMessage: any) => {
                updateBoard(newMessage.x, newMessage.y, newMessage.name);
            });

            // 게임 시작 신호 수신 구독
            stomp.subscribe("/topic/" + roomId.current, (newMessage: any) => {
                if (newMessage.gameState === "start") setIsGameStarted(true);
                if (newMessage.startUser === login.loginInfo.id) setIsMyTurn(true);
            });

            // 게임 시작시 필요한 추가 정보 송신
            stomp.send("/app/enterRoom/" + roomId.current, { name: login.loginInfo.id });

            // 매칭 완료
            setIsMatchingState(false);
        } catch (error) {
            console.error("WebSocket 연결 실패:", error);
        }
    };

    // stomp 연결 전 게임 연결할 roomId 가져오는 함수
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const getRoomId = async () => {
        while (!stopFinding.current) {
            try {
                const res = await axios.get("http://localhost:8080/roomId");
                roomId.current = res.data.roomId;
                return;
            } catch (err) {
                console.log("현재 방이 없습니다. 5초 뒤 다시 시도합니다.");
                await wait(5000);
            }
        }
        console.log("Component unmounted : getRoomId() 중지"); // stopFinding이 true인 경우
    };

    // roomId를 받아와서 해당 roomId로 소켓 세팅 하는 함수
    const setMatch = async () => {
        await getRoomId().catch(console.log);
        if (roomId.current !== "-1") {
            await setupStomp();
        }
    };

    // 로그인 여부 확인 후 stomp연결 하는 과정
    useEffect(() => {
        if (!login.loginInfo.isLogin) {
            navigate("/login");
            return; // 조건이 충족되면 navigate 실행 후 더 이상 진행하지 않음
        }

        setMatch(); // login이 true인 경우만 실행

        return () => {
            stomp.unsubscribe();
            stomp.disconnect();
            stopFinding.current = true;
        };
    }, [login, navigate]);

    return (
        <div className="bg-myWhite h-screen w-screen flex justify-center items-center">
            {login.loginInfo.isLogin ? (
                isGameStarted ? (
                    <div className="w-screen h-screen justify-center items-center flex flex-col ">
                        <div>{time}</div>
                        <GameBoard data={tempBoardData} onCellClick={handleCellClick} />
                        <button onClick={() => sendNewPosition()} className="p-1 border border-gray-400">
                            배치 전송
                        </button>
                        <button onClick={() => setIsGameStarted(false)} className="p-1 border border-gray-400">
                            강제 게임 종료 버튼
                        </button>
                    </div>
                ) : (
                    <div>
                        <h1>STOMP WebSocket Example</h1>
                        {isMatchingState ? (
                            <div>
                                <LoadingCircle />
                                <span>매칭중</span>
                            </div>
                        ) : (
                            <div>매칭완료</div>
                        )}
                        <div>
                            <ul>
                                {messages.map((message, index) => (
                                    <li key={index}>{message}</li>
                                ))}
                            </ul>
                            <div className="flex flex-col">
                                <button onClick={checkSubscribe} className="p-1 border border-gray-400">
                                    테스트 용 구독 체크
                                </button>
                                <button onClick={() => setIsGameStarted(true)} className="p-1 border border-gray-400">
                                    강제 게임 시작 버튼
                                </button>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                <div>로그인을 다시 시도해주세요.</div>
            )}
        </div>
    );
}

export default GamePage;
