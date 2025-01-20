// src/index.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import Page from "./page";

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <Page />
    </React.StrictMode>
);
