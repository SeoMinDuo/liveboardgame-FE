import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import * as LoginInfoContext from "./context";
import Main from "./pages/MainPage";
import Login from "./pages/LoginPage";
import Game from "./pages/GamePage";
import KakaoCallback from "./components/KakaoCallback";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/game",
    element: <Game />,
  },
  {
    path: "/oauth",
    element: <KakaoCallback />,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <LoginInfoContext.LoginProvider>
    <RouterProvider router={router} />
  </LoginInfoContext.LoginProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
