"use client";

import React from "react";
import { CircularProgress, Box } from "@mui/material";

const LoadingSpinner: React.FC = () => {
    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            marginY={2}
            // Du kannst hier weitere Styles hinzufügen
        >
            <CircularProgress />
        </Box>
    );
};

export default LoadingSpinner;
