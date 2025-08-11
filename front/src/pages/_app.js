import React, { useEffect } from "react";
import Head from "next/head";
import wrapper from "../store/configureStore";
import System00 from "./system";
import { systemSetting } from "../func/system";
import { urlQuery } from "../func/common";
import { useRouter } from "next/router";

const App = ({ Component, pageProps, ...other }) => {
    const router = useRouter();
    const is404Page = router.pathname === "/404";
    const isUnderMaintenance = systemSetting.timeSet(); // 시스템 점검시간 계산(시작true 끝나면 false)
    // const isUnderMaintenance = false; //시스템 점검 끝났을 때, 안할 때
    useEffect(() => {
        //사이트 타입 체크 BF_SITE_TYPE
        pageProps.query && urlQuery.getQuery(pageProps.query);
    }, []);

    return (
        <>
            <Head>
                <meta charSet="utf-8" />
                {/* 다크모드 막음(s) */}
                <meta name="color-scheme" content="light only" />
                <meta name="supported-color-schemes" content="light" />
                {/* 다크모드 막음(e) */}

                {/* 메타태그 오픈그래프 */}

                <meta
                    property="og:title"
                    content={
                        pageProps.metaTitle == undefined ||
                        pageProps.metaTitle == ""
                            ? "데이터분석"
                            : pageProps.metaTitle
                    }
                ></meta>
                <meta property="og:image" content=""></meta>

                {/* 메타태그 트위터 */}
                <meta
                    name="twitter:title"
                    content={
                        pageProps.metaTitle == undefined ||
                        pageProps.metaTitle == ""
                            ? "데이터분석"
                            : pageProps.metaTitle
                    }
                />

                {/* 검색 로봇 수집이 필요한 페이지의 경우 robots 보임 */}
                {process.env.NEXT_PUBLIC_ENV === "production" &&
                pageProps.robots ? (
                    // 로봇방문 허용
                    <>
                        <meta name="robots" content="ALL" />
                        <meta name="robots" content="index, follow" />
                    </>
                ) : (
                    <>
                        {/* 로봇방문 허용하지 않음 */}
                        <meta name="robots" content="none" />
                        {/* 색인(Index)되지 않게 하기 noindex,nofollow */}
                        <meta name="robots" content="noindex,nofollow" />
                    </>
                )}

                <title>
                    {pageProps.metaTitle == undefined ||
                    pageProps.metaTitle == ""
                        ? "데이터분석"
                        : pageProps.metaTitle}
                </title>
            </Head>

            {isUnderMaintenance ? (
                <System00 />
            ) : (
                <>
                    <Component {...other} {...pageProps} />
                </>
            )}
        </>
    );
};

export default wrapper.withRedux(App);
