import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useLoginContext } from "../context";
import LoadingCircle from "../components/LoadingCircle";
import GameBoard from "../components/GameBoard";
import StompService from "../stomp";
import axios from "axios";
import { BoardCellDataType, CastleColor, Pos, WallState } from "../type/types";

function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    const copyArray = [];
    for (const item of obj) {
      copyArray.push(deepCopy(item));
    }
    return copyArray as any as T;
  }

  const copyObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copyObj[key] = deepCopy(obj[key]);
    }
  }
  return copyObj;
}
function areAllTrue(obj: WallState): boolean {
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== true) {
      return true; // 하나라도 false가 있다면 true 반환
    }
  }
  return false; // 모든 속성이 true일 때 false 반환
}
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

  let myCastleColor = useRef<CastleColor>();
  let oppCastleColor = useRef<CastleColor>();
  let roomId = useRef("-1");
  let stopFinding = useRef(false);
  const clickedCell = useRef<Pos>({ x: -1, y: -1 });
  const login = useLoginContext();
  const navigate = useNavigate();

  const goHome = async () => {
    setTimeout(() => {
      navigate("/");
    }, 2000); // 1000 밀리초 (1초) 뒤에 navigate 실행
  };
  // GameBoard
  // const initialBoardData: string[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ""));
  const initialBoardData: BoardCellDataType[][] = Array.from(
    { length: 9 },
    (_, row) =>
      Array.from({ length: 9 }, (_, col) =>
        row === 4 && col === 4
          ? { own: "Center", visited: false, blocked: false, territory: "" }
          : { own: "", visited: false, blocked: false, territory: "" }
      )
  );

  const boardData = useRef<BoardCellDataType[][]>(deepCopy(initialBoardData));

  const [tempBoardData, setTempBoardData] = useState<BoardCellDataType[][]>(
    deepCopy(initialBoardData)
  );

  const pos = useRef<Pos>({ x: -1, y: -1 });

  const checkBoardData = useRef<BoardCellDataType[][]>(
    deepCopy(initialBoardData)
  );
  const visitedCells = useRef<{ x: number; y: number }[]>([]);
  let meetWall = useRef<WallState>({
    Top: false,
    Bottom: false,
    Left: false,
    Right: false,
  });
  const handleCellClick = (x: number, y: number) => {
    if (isMyTurn === false) return;
    if (checkBoardData.current[y][x].blocked) {
      alert("이미 영토 내부 입니다");
      return;
    }
    const newBoardData = deepCopy(boardData.current.map((row) => [...row]));
    // const newBoardData = deepCopy(checkBoardData.current);
    if (newBoardData[y][x].own === "") {
      newBoardData[y][x].own = myCastleColor.current!; // 빈 곳이면 말 추가
      pos.current = { x, y };
    } else {
      pos.current = { x: -1, y: -1 };
    }
    setTempBoardData(newBoardData);
    //더블 클릭?
    if (clickedCell.current.x === x && clickedCell.current.y === y) {
      sendNewPosition();
    } else {
      clickedCell.current = { x, y };
    }
  };

  const checkTerritory = (
    x: number,
    y: number,
    startOwn: CastleColor
  ): boolean => {
    // 방문기록 남기기
    checkBoardData.current[y][x].visited = true;
    visitedCells.current.push({ x, y });

    // 4방향 테두리 체크 후 접근
    // 오른쪽
    if (
      x + 1 < 9 &&
      checkBoardData.current[y][x + 1].own === "" &&
      checkBoardData.current[y][x + 1].visited === false
    ) {
      const result = checkTerritory(x + 1, y, startOwn);
      if (!result) {
        checkBoardData.current[y][x].visited = false;
        return false;
      }
    } else {
      if (x + 1 === 9) meetWall.current.Right = true;
      else if (checkBoardData.current[y][x + 1].own !== startOwn) {
        if (
          checkBoardData.current[y][x + 1].own !== "Center" &&
          checkBoardData.current[y][x + 1].own !== ""
        ) {
          checkBoardData.current[y][x].visited = false;
          return false;
        }
      }
    }
    // 아래
    if (
      y + 1 < 9 &&
      checkBoardData.current[y + 1][x].own === "" &&
      checkBoardData.current[y + 1][x].visited === false
    ) {
      const result = checkTerritory(x, y + 1, startOwn);
      if (!result) {
        checkBoardData.current[y][x].visited = false;
        return false;
      }
    } else {
      if (y + 1 === 9) meetWall.current.Bottom = true;
      else if (checkBoardData.current[y + 1][x].own !== startOwn) {
        if (
          checkBoardData.current[y + 1][x].own !== "Center" &&
          checkBoardData.current[y + 1][x].own !== ""
        ) {
          checkBoardData.current[y][x].visited = false;
          return false;
        }
      }
    }
    // 위
    if (
      y - 1 > -1 &&
      checkBoardData.current[y - 1][x].own === "" &&
      checkBoardData.current[y - 1][x].visited === false
    ) {
      const result = checkTerritory(x, y - 1, startOwn);
      if (!result) {
        checkBoardData.current[y][x].visited = false;
        return false;
      }
    } else {
      if (y - 1 === -1) meetWall.current.Top = true;
      else if (checkBoardData.current[y - 1][x].own !== startOwn) {
        if (
          checkBoardData.current[y - 1][x].own !== "Center" &&
          checkBoardData.current[y - 1][x].own !== ""
        ) {
          checkBoardData.current[y][x].visited = false;
          return false;
        }
      }
    }
    // 왼
    if (
      x - 1 > -1 &&
      checkBoardData.current[y][x - 1].own === "" &&
      checkBoardData.current[y][x - 1].visited === false
    ) {
      const result = checkTerritory(x - 1, y, startOwn);
      if (!result) {
        checkBoardData.current[y][x].visited = false;
        return false;
      }
    } else {
      if (x - 1 === -1) meetWall.current.Left = true;
      else if (checkBoardData.current[y][x - 1].own !== startOwn) {
        if (
          checkBoardData.current[y][x - 1].own !== "Center" &&
          checkBoardData.current[y][x - 1].own !== ""
        ) {
          checkBoardData.current[y][x].visited = false;
          return false;
        }
      }
    }

    console.log("checkterritory: " + true);

    return true;
  };

  // 서버로 배치한 말 보내기
  const sendNewPosition = () => {
    if (!isMyTurn) return;
    if (pos.current?.x === -1 || pos.current?.y === -1) {
      passThisTurn();
      return;
    }
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
    setStartTimer(false);
  };

  const setCheckBoardData = () => {
    visitedCells.current = [];
    // 영토 체크
    checkBoardData.current = deepCopy(boardData.current);
    for (let i = 0; i < 9; i++) {
      // y좌표
      for (let j = 0; j < 9; j++) {
        // x좌표
        if (
          // 성 찾았다면
          checkBoardData.current[i][j].own === "Green" ||
          checkBoardData.current[i][j].own === "Red"
        ) {
          // 4방향 테두리 체크 후 접근
          // 오른쪽

          // 테스트값 초기화
          meetWall.current = {
            Top: false,
            Left: false,
            Right: false,
            Bottom: false,
          };
          visitedCells.current = [];
          if (
            j + 1 < 9 &&
            checkBoardData.current[i][j + 1].own === "" &&
            checkBoardData.current[i][j + 1].visited === false
          )
            if (
              checkTerritory(j + 1, i, checkBoardData.current[i][j].own) &&
              areAllTrue(meetWall.current)
            ) {
              for (let k = 0; k < visitedCells.current.length; k++) {
                const el = visitedCells.current[k];
                checkBoardData.current[el.y][el.x].blocked = true;
                boardData.current[el.y][el.x].territory =
                  checkBoardData.current[i][j].own;
              }
            }
          // 아래
          // 테스트값 초기화
          meetWall.current = {
            Top: false,
            Left: false,
            Right: false,
            Bottom: false,
          };
          visitedCells.current = [];
          if (
            i + 1 < 9 &&
            checkBoardData.current[i + 1][j].own === "" &&
            checkBoardData.current[i + 1][j].visited === false
          )
            if (
              checkTerritory(j, i + 1, checkBoardData.current[i][j].own) &&
              areAllTrue(meetWall.current)
            ) {
              for (let k = 0; k < visitedCells.current.length; k++) {
                const el = visitedCells.current[k];
                checkBoardData.current[el.y][el.x].blocked = true;
                boardData.current[el.y][el.x].territory =
                  checkBoardData.current[i][j].own;
              }
            }
          // 위
          // 테스트값 초기화
          meetWall.current = {
            Top: false,
            Left: false,
            Right: false,
            Bottom: false,
          };
          visitedCells.current = [];
          if (
            i - 1 > -1 &&
            checkBoardData.current[i - 1][j].own === "" &&
            checkBoardData.current[i - 1][j].visited === false
          )
            if (
              checkTerritory(j, i - 1, checkBoardData.current[i][j].own) &&
              areAllTrue(meetWall.current)
            ) {
              for (let k = 0; k < visitedCells.current.length; k++) {
                const el = visitedCells.current[k];
                checkBoardData.current[el.y][el.x].blocked = true;
                checkBoardData.current[el.y][el.x].territory =
                  checkBoardData.current[i][j].own;
              }
            }
          // 왼
          // 테스트값 초기화
          meetWall.current = {
            Top: false,
            Left: false,
            Right: false,
            Bottom: false,
          };
          visitedCells.current = [];
          if (
            j - 1 > -1 &&
            checkBoardData.current[i][j - 1].own === "" &&
            checkBoardData.current[i][j - 1].visited === false
          )
            if (
              checkTerritory(j - 1, i, checkBoardData.current[i][j].own) &&
              areAllTrue(meetWall.current)
            ) {
              for (let k = 0; k < visitedCells.current.length; k++) {
                const el = visitedCells.current[i];
                checkBoardData.current[el.y][el.x].blocked = true;
                boardData.current[el.y][el.x].territory =
                  checkBoardData.current[i][j].own;
              }
            }
        }
      }
    }
  };
  const updateBoard = async (
    x: number,
    y: number,
    own: string,
    gameState: number
  ) => {
    console.log("updateBoard");

    // 게임시간 설정
    setSeconds(60);
    setStartTimer(true);
    // 내가 이미 배치한 내용
    if (own === login.loginInfo.id) {
      setCheckBoardData();
      setTempBoardData(boardData.current);
      // 게임 승패 체크
      if (gameState !== 0) {
        if (gameState === 1) {
          if (own === login.loginInfo.id) {
            printTurnMessage("영토 승리!");
          } else {
            printTurnMessage("영토 패배..");
          }
        } else if (gameState === 2) {
          if (own === login.loginInfo.id) {
            printTurnMessage("상대 성을 격파하였습니다!\n 승리!");
          } else {
            printTurnMessage("아군 성이 파괴되었습니다..\n 패배..");
          }
        } else if (gameState === 3) {
          printTurnMessage("명승부였네요.\n비겼습니다!");
        }

        // 게임 종료
        stomp.unsubscribe();
        stomp.disconnect();
        goHome();
        return;
      } else {
        printTurnMessage("상대 턴!");
        setIsMyTurn(false);
      }
    }
    // 상대가 배치한 내용 업데이트
    else {
      if (x === -1 || y === -1) {
        // 상대가 아무 것도 배치하지 않았다면
        printTurnMessage("상대가 패스하였습니다!");
      } else {
        // const newBoardData = boardData.current.map((row) => [...row]);
        // newBoardData[y][x].own = oppCastleColor.current!;
        // boardData.current = deepCopy(newBoardData);

        boardData.current[y][x].own = oppCastleColor.current!;
        ///
        setCheckBoardData();
        ///

        setTempBoardData(boardData.current);
        // boardData.current = deepCopy(checkBoardData.current);
      }

      // 게임 승패 체크
      if (gameState !== 0) {
        setStartTimer(false);
        if (gameState === 1) {
          if (own === login.loginInfo.id) {
            printTurnMessage("영토 승리!");
          } else {
            printTurnMessage("영토 패배..");
          }
        } else if (gameState === 2) {
          if (own === login.loginInfo.id) {
            printTurnMessage("상대 성을 격파하였습니다!\n 승리!");
          } else {
            printTurnMessage("아군 성이 파괴되었습니다..\n 패배..");
          }
        } else if (gameState === 3) {
          printTurnMessage("명승부였네요.\n비겼습니다!");
        }

        // 게임 종료
        stomp.unsubscribe();
        stomp.disconnect();
        goHome();
        return;
      } else {
        printTurnMessage("내 턴!");
      }
      // 보드 업데이트 후 내 차례
      setIsMyTurn(true);
    }
  };

  // stomp 연결, stomp 메세지 수신 구독
  const setupStomp = async () => {
    try {
      // 소켓 연결
      await stomp.connect();

      // 새로운 말 배치 수신 구독
      stomp.subscribe(
        "/topic/gameboard/" + roomId.current,
        (newMessage: any) => {
          updateBoard(
            newMessage.x,
            newMessage.y,
            newMessage.name,
            newMessage.gameState
          );
        }
      );

      // 게임 시작 신호 수신 구독
      stomp.subscribe("/topic/" + roomId.current, (newMessage: any) => {
        if (newMessage.gameState === "start") {
          setIsGameStarted(true);
          if (newMessage.startUser === login.loginInfo.id) {
            setIsMyTurn(true);
            myCastleColor.current = "Green";
            oppCastleColor.current = "Red";
            printTurnMessage("내 턴!");
          } else {
            myCastleColor.current = "Red";
            oppCastleColor.current = "Green";
            printTurnMessage("상대 턴!");
          }
          setStartTimer(true);
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
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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
    console.log(isGameStarted);
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

  const passThisTurn = () => {
    if (!isMyTurn) return;

    setIsMyTurn(false);
    stomp.send("/app/gameboard/" + roomId.current, {
      x: -1,
      y: -1,
      name: login.loginInfo.id,
    });
    setTempBoardData(boardData.current);
    // 선택된 위치값 초기화
    pos.current = { x: -1, y: -1 };
    printTurnMessage("상대 턴!");
  };

  // 60초 카운터
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (isGameStarted && startTimer && seconds > 0) {
      timerInterval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      // 0초일 때 특정 동작 실행
      console.log("Timer reached 0 seconds. Perform action here.");
      if (isMyTurn) {
        // 시간이 다되었으니 현재 선택된 위치값으로 서버에 전송
        console.log(isMyTurn);

        sendNewPosition();
      }
    }

    return () => {
      clearInterval(timerInterval);
    };
  }, [startTimer, seconds, isGameStarted]);
  return (
    <div className="bg-myWhite h-screen w-screen flex justify-center items-center">
      {showTurnMessage && (
        <div
          className={`whitespace-pre-line text-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-80 text-white flex justify-center items-center text-2xl ${
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
              <>
                <button
                  onClick={() => sendNewPosition()}
                  className="p-1 border border-gray-400"
                >
                  배치 전송
                </button>
                <button
                  onClick={() => passThisTurn()}
                  className="p-1 border border-gray-400"
                >
                  패스
                </button>
              </>
            )}
            <button
              onClick={() => setIsGameStarted(false)}
              className="p-1 border border-gray-400"
            >
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
