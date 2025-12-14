import "antd/dist/reset.css";
import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles/global.scss";
import { PostsPage } from "./PostsPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostsPage />
  </React.StrictMode>,
);
