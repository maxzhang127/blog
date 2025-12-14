import "antd/dist/reset.css";
import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles/global.scss";
import { PostPage } from "./PostPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostPage />
  </React.StrictMode>
);
