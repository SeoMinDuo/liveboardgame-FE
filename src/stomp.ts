import Stomp from 'stompjs';

const WebSocketUrl = 'ws://localhost:8080/ws'; // WebSocket 서버 주소
const StompClient = Stomp.client(WebSocketUrl);

const connect = (): void => {
  StompClient.connect({}, () => {
    console.log('Connected to WebSocket');
  });
};

const subscribe = (destination: string, callback: (message: any) => void): Stomp.Subscription => {
  return StompClient.subscribe(destination, (message: Stomp.Message) => {
    if (message.body) {
      callback(JSON.parse(message.body));
    }
  });
};

const send = (destination: string, data: any): void => {
  StompClient.send(destination, {}, JSON.stringify(data));
};

const disconnect = (): void => {
  StompClient.disconnect(() => {
    console.log('Disconnected from WebSocket');
  });
};

export { connect, subscribe, send, disconnect };
