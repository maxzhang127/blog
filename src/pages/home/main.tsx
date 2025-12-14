import "antd/dist/reset.css";
import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles/global.scss";
import { HomePage } from "./HomePage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
);
