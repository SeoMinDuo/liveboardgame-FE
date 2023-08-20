import Stomp from "stompjs";
const WebSocketUrl = "ws://localhost:8080/ws"; // Spring 서버의 WebSocket 주소로 변경해주세요.
class StompService {
    private stompClient: Stomp.Client | null = null;
    private stompSubscription!: Stomp.Subscription | null;
    public async connect(roomId: string, callback: (message: Stomp.Message) => void): Promise<void> {
        this.stompClient = Stomp.over(new WebSocket(WebSocketUrl));
        return await new Promise((resolve, reject) => {
            this.stompClient?.connect(
                {},
                () => {
                    console.log("Websocket 연결 성공");
                    if (this.stompClient) {
                        return (this.stompSubscription = this.stompClient.subscribe(
                            "topic/" + roomId,
                            (message: Stomp.Message) => {
                                if (message.body) {
                                    callback(JSON.parse(message.body));
                                }
                            }
                        ));
                    }
                    resolve();
                },
                (error) => {
                    console.log("Websocket 연결 실패");
                    reject(error);
                }
            );
        });
    }

    public isConnected() {
        return this.stompClient?.connected || false;
    }

    public subscribe(destination: string, callback: (message: Stomp.Message) => void) {
        if (this.isConnected()) {
            console.log("WebSocket 구독을 시도합니다."); // 연결되지 않았을 때 처리
            // 추가: WebSocket 연결 상태 확인
            if (this.stompClient) {
                return (this.stompSubscription = this.stompClient.subscribe(destination, (message: Stomp.Message) => {
                    if (message.body) {
                        callback(JSON.parse(message.body));
                    }
                }));
            }
        } else {
            console.log("[구독 실패]WebSocket 연결이 필요합니다."); // 연결되지 않았을 때 처리
        }
    }

    public unsubscribe(): void {
        this.stompSubscription?.unsubscribe();
        this.stompSubscription = null;
    }

    public isSubscribed() {
        console.log(this.stompClient?.subscriptions);
        if (this.stompClient?.subscriptions) return true;
        else return false;
    }

    public send(destination: string, data: any) {
        if (this.stompClient && this.isConnected()) {
            // 추가: 현재 연결 상태를 확인
            this.stompClient.send(destination, {}, JSON.stringify(data));
        } else {
            console.log("WebSocket send() 실패");
        }
    }

    public disconnect() {
        if (this.stompClient && this.isConnected()) {
            this.stompClient.disconnect(() => {
                console.log("WebSocket 연결이 해제되었습니다.");
            });
            this.stompClient = null;
        }
    }
}

export default StompService;
