"use client";

import * as pdfjsLib from "pdfjs-dist";

// 1) Hier setzt du den Pfad zu deinem lokalen Worker im public-Ordner.
//    Stelle sicher, dass pdf.worker.min.js mit der passenden Version übereinstimmt.
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

// 2) Exportiere pdfjsLib.
//    Andere Module/Komponenten können diesen vorkonfigurierten pdfjs-Import verwenden.
export default pdfjsLib;
