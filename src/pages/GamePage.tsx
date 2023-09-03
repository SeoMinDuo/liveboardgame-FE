import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useLoginContext } from "../context";
import LoadingCircle from "../components/LoadingCircle";
import GameBoard from "../components/GameBoard";
import StompService from "../stomp";
import axios from "axios";

type Pos = {
    x: number;
    y: number;
};
const stomp = new StompService();
function GamePage() {
    const [isMatchingState, setIsMatchingState] = useState(true);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [seconds, setSeconds] = useState(60);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [startTimer, setStartTimer] = useState(false);
    const [turnMessage, setTurnMessage] = useState("");
    const [showTurnMessage, setShowTurnMessage] = useState(false);
    const [fade, setFade] = useState(true);

    let roomId = useRef("-1");
    let stopFinding = useRef(false);
    const login = useLoginContext();
    const navigate = useNavigate();

    // GameBoard
    const initialBoardData: string[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ""));

    const boardData = useRef<string[][]>([...initialBoardData]);

    const [tempBoardData, setTempBoardData] = useState<string[][]>([...initialBoardData]);

    const pos = useRef<Pos>({ x: -1, y: -1 });

    const handleCellClick = (x: number, y: number) => {
        console.log("handleCellClick");

        if (isMyTurn === false) return;

        const newBoardData = boardData.current.map((row) => [...row]);
        if (newBoardData[y][x] === "") {
            newBoardData[y][x] = "ME"; // 예시로 X 말 추가
            pos.current = { x, y };
        } else {
            pos.current = { x: -1, y: -1 };
        }
        setTempBoardData(newBoardData);
    };

    // 서버로 배치한 말 보내기
    const sendNewPosition = () => {
        if (!isMyTurn) return;
        if (pos.current?.x === -1 || pos.current?.y === -1) return;
        console.log("sendNewPosition");

        setIsMyTurn(false);
        boardData.current = [...tempBoardData];
        stomp.send("/app/gameboard/" + roomId.current, {
            x: pos.current?.x,
            y: pos.current?.y,
            name: login.loginInfo.id,
        });

        // 선택된 위치값 초기화
        pos.current = { x: -1, y: -1 };
        printTurnMessage("상대 턴!");
    };

    const updateBoard = (x: number, y: number, own: string) => {
        console.log("updateBoard");

        if (own === login.loginInfo.id) setIsMyTurn(false); // 내가 이미 배치한 내용
        else {
            // 상대가 배치한 내용
            if (x === -1 || y === -1) {
                // 상대가 아무 것도 배치하지 않았다면
                printTurnMessage("상대가 패스하였습니다!");
            }
            const newBoardData = boardData.current.map((row) => [...row]);
            newBoardData[y][x] = "YOU";
            boardData.current = newBoardData;
            setTempBoardData(newBoardData);

            // 보드 업데이트 후 내 차례
            setIsMyTurn(true);
            printTurnMessage("내 턴!");
        }
        setSeconds(60);
        setStartTimer(true);
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
                if (newMessage.startUser === login.loginInfo.id) {
                    setIsMyTurn(true);
                    printTurnMessage("내 턴!");
                }
            });

            // 게임 시작시 필요한 추가 정보 송신
            stomp.send("/app/enterRoom/" + roomId.current, {
                name: login.loginInfo.id,
            });

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
            return;
        }
        // login이 true인 경우만 실행
        setMatch();

        return () => {
            stomp.unsubscribe();
            stomp.disconnect();
            stopFinding.current = true;
        };
    }, [login, navigate]);

    // 화면에 턴 메세지 출력하는 함수
    const printTurnMessage = (message: string) => {
        setTurnMessage(message);
        setShowTurnMessage(true);
        setTimeout(() => {
            setFade(false); // 사라지는 애니메이션(1초)
            setTimeout(() => {
                // 애니메이션 종료 후 진짜 없애기
                setShowTurnMessage(false);
                setFade(true);
            }, 1000);
        }, 1000);
    };

    // 60초 카운터
    useEffect(() => {
        let timerInterval: NodeJS.Timeout;

        if (startTimer && seconds > 0) {
            timerInterval = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds - 1);
            }, 1000);
        } else if (seconds === 0) {
            // 0초일 때 특정 동작 실행
            console.log("Timer reached 0 seconds. Perform action here.");
            if (isMyTurn) {
                // 시간이 다되었으니 현재 선택된 위치값으로 서버에 전송
                sendNewPosition();
            }
        }

        return () => {
            clearInterval(timerInterval);
        };
    }, [startTimer, seconds]);
    return (
        <div className="bg-myWhite h-screen w-screen flex justify-center items-center">
            {showTurnMessage && (
                <div
                    className={`fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-80 text-white flex justify-center items-center text-2xl ${
                        fade ? "animate-[fadein_1s]" : "animate-[fadeout_1s]"
                    }`}
                >
                    {turnMessage}
                </div>
            )}
            {login.loginInfo.isLogin ? (
                isGameStarted ? (
                    <div className="w-screen h-screen justify-center items-center flex flex-col">
                        <div>{seconds}</div>
                        <GameBoard data={tempBoardData} onCellClick={handleCellClick} />
                        {isMyTurn && (
                            <button onClick={() => sendNewPosition()} className="p-1 border border-gray-400">
                                배치 전송
                            </button>
                        )}
                        <button onClick={() => setIsGameStarted(false)} className="p-1 border border-gray-400">
                            강제 게임 종료 버튼
                        </button>
                    </div>
                ) : (
                    <div className="w-screen h-screen justify-center items-center flex flex-col">
                        {isMatchingState ? (
                            <div>
                                <LoadingCircle className="m-[10px]" />
                            </div>
                        ) : (
                            <div>매칭완료</div>
                        )}
                        <div>
                            <div className="flex flex-col">
                                <button
                                    onClick={() => {
                                        setIsGameStarted(true);
                                        setStartTimer(true);
                                    }}
                                    className="p-1 border border-gray-400"
                                >
                                    강제 게임 시작 및 타이머 시작
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
