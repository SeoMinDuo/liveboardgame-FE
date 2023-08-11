import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useLoginContext } from "../context";
import LoadingCircle from "../components/LoadingCircle";
import GameBoard from "../components/GameBoard";
import StompService from "../stomp";
import axios from "axios";

const stomp = new StompService();
function GamePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isMatchingState, setIsMatchingState] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);

  let stopFinding = useRef(false);
  const login = useLoginContext();
  const navigate = useNavigate();

  // GameBoard
  const initialBoardData: string[][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => "")
  );

  const [boardData, setBoardData] = useState<string[][]>(initialBoardData);

  const handleCellClick = (x: number, y: number) => {
    const newBoardData = [...boardData];
    newBoardData[y][x] = "X"; // 예시로 X 말 추가
    setBoardData(newBoardData);
  };

  // input으로 메세지가 들어오면 inputMessage 수정
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setInputMessage(event.target.value);
  };

  // 서버로 input의 메세지 전송
  const handleSendMessage = (): void => {
    if (inputMessage.trim() !== "") {
      stomp.send("/app/sendMessage", { text: inputMessage });
      setInputMessage("");
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

  // 메세지가 들어오면 이전에 받았던 메세지와 합치는 함수
  const handleNewMessage = (newMessage: string) => {
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // stomp 연결, stomp 메세지 수신 구독
  const setupStomp = async (roomId: string) => {
    try {
      // 소켓 연결
      await stomp.connect();

      // 새로운 말 배치 수신 구독
      stomp.subscribe("/app/gameboard/" + roomId, (newMessage: any) => {
        handleNewMessage(newMessage.content); // 새 메시지를 받았을 때 처리
        if (newMessage.content === "start") setIsGameStarted(true);
      });

      // 게임 시간 카운트 수신 구독
      stomp.subscribe("topic/gameboard/" + roomId, (newMessage: any) => {
        handleNewMessage(newMessage.content); // 새 메시지를 받았을 때 처리
        if (newMessage.content === "start") setIsGameStarted(true);
      });

      // 게임 시작 신호 수신 구독
      stomp.subscribe("topic/" + roomId, (newMessage: any) => {
        handleNewMessage(newMessage.content); // 새 메시지를 받았을 때 처리
        if (newMessage.content === "start") setIsGameStarted(true);
      });

      // 게임 시작시 필요한 추가 정보 송신
      stomp.send("/app/enterRoom/" + roomId, { name: "user1" });

      // 매칭 완료
      setIsMatchingState(false);
    } catch (error) {
      console.error("WebSocket 연결 실패:", error);
    }
  };

  // stomp 연결 전 게임 연결할 roomId 가져오는 함수
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getRoomId = async () => {
    while (!stopFinding.current) {
      try {
        const res = await axios.get("http://localhost:8080/roomId", {
          params: { XXXID: "123" },
        });
        return res.data.roomId;
      } catch (err) {
        console.log("현재 방이 없습니다. 5초 뒤 다시 시도합니다.");
        await wait(5000);
      }
    }
    console.log("Component unmounted : getRoomId() 중지"); // stopFinding이 true인 경우
  };

  // roomId를 받아와서 해당 roomId로 소켓 세팅 하는 함수
  const setMatch = async () => {
    const roomId = await getRoomId().catch(console.log);
    if (roomId) {
      await setupStomp(roomId);
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
    <div className="bg-myWhite h-screen flex justify-center items-center">
      {login.loginInfo.isLogin ? (
        isGameStarted ? (
          <div className="flex flex-col">
            <GameBoard data={boardData} onCellClick={handleCellClick} />
            게임이 시작되었습니다.
            <button
              onClick={() => setIsGameStarted(false)}
              className="p-1 border border-gray-400"
            >
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
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                />
                <button onClick={handleSendMessage}>Send</button>
                <button
                  onClick={checkSubscribe}
                  className="p-1 border border-gray-400"
                >
                  테스트 용 구독 체크
                </button>
                <button
                  onClick={() => setIsGameStarted(true)}
                  className="p-1 border border-gray-400"
                >
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
