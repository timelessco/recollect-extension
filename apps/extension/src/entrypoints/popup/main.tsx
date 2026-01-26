import "@/assets/tailwind.css";

import React from "react";
import ReactDOM from "react-dom/client";

import { Client } from "./client";

const rootElement = document.querySelector("#root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Client />
    </React.StrictMode>
  );
}
