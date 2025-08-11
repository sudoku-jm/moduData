import { Box, CircularProgress } from "@mui/material";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";

const LoadingEl = () => {
    const { globalLoading } = useSelector((state) => state.common);
    return (
        <>
            {globalLoading ? (
                <Box
                    sx={{
                        position: "fixed",
                        width: "100vw",
                        height: "100vh",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 99,
                        // backgroundColor: "rgba(0,0,0,0.4)",
                    }}
                >
                    <CircularProgress size={60} />
                </Box>
            ) : null}
        </>
    );
};

export default LoadingEl;
