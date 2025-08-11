import React from "react";
import Head from "next/head";
import { GlobalStyle } from "../styles/GlobalStyle";

export default function Layout({ pageTitle, children }) {
    let titleConcat = "메인";
    if (pageTitle) titleConcat = pageTitle + " | " + titleConcat;

    return (
        <>
            <GlobalStyle />
            <Head>
                <title>{titleConcat}</title>
            </Head>
            <div id="container">{children}</div>
        </>
    );
}
