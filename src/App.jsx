import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { useEffect } from "react";
// import { io } from "socket.io-client";

import SignUp from "./Pages/SignUp";
import Login from "./Pages/Login";
import ChatPage from "./Pages/ChatPage";
import DashboardLayout from "./Pages/DashboardLayout";

function App() {
  // useEffect(() => {
  //   console.log("Trying socket connection...");

  //   const token = localStorage.getItem("token");

  //   const socket = io("http://localhost:3000", {
  //     auth:{
  //       token,
  //     },
  //     transports: ["websocket"],
  //     // withCredentials: true,
  //   });

  //   socket.on("connect", () => {
  //     console.log("Socket Connected:", socket.id);
  //   });

  //   socket.on("connect_error", (err) => {
  //     console.log("Socket Connection Error:", err.message);
  //   });

  //   socket.on("newMessage", (message) => {
  //   setMessages((prev) => [...prev, message]);
  // });

  //   socket.on("disconnect", () => {
  //     console.log("Socket Disconnected");
  //   });

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  return (
    <BrowserRouter>
     <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/signup" element={<SignUp />} />
  <Route path="/login" element={<Login />} />

  {/* DASHBOARD LAYOUT */}
  <Route path="/dashboard" element={<DashboardLayout />}>
    {/* DEFAULT */}
    <Route index element={<ChatPage />} />

    {/* USER CHAT */}
    <Route path=":username" element={<ChatPage />} />

    {/* GROUP CHAT */}
    <Route path="group/:groupName" element={<ChatPage />} />
  </Route>
</Routes>
    </BrowserRouter>
  );
}

export default App;