import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    :root{

    }
    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center,
    dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend,
    table, caption, tbody, tfoot, thead, tr, th, td,
    article, aside, canvas, details, embed, 
    figure, figcaption, footer, header, hgroup, 
    menu, nav, output, ruby, section, summary,
    time, mark, audio, video {
        margin: 0;
        padding: 0;
        border: 0;
        font-size: 100%;
        font: inherit;
        vertical-align: baseline;
    }
    /* HTML5 display-role reset for older browsers */
    article, aside, details, figcaption, figure, 
    footer, header, hgroup, menu, nav, section {
        display: block;
    }
    body {
        line-height: 1;
    }
    ol, ul {
        list-style: none;
    }
    blockquote, q {
        quotes: none;
    }
    blockquote:before, blockquote:after,
    q:before, q:after {
        content: '';
        content: none;
    }
    table {
        border-collapse: collapse;
        border-spacing: 0;
    }
    // 기본 브라우저 = 16px. 16px의 62.5%는 10px = 1rem.
    html{
        font-size:62.5%;
        * {
            font-size: 1.4rem;
        }
    }
    body{
        font-family: 'Noto Sans KR', sans-serif;
        font-weight:400;
    }
    *::-webkit-scrollbar {
        width: 10px;
        height: 10px;
        background-color: #F5F5F5;
    }
    *::-webkit-scrollbar-track {
        -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.00);
    }
    *::-webkit-scrollbar-thumb {
        background-color: rgba(0,0,0,.1);
        outline: none;
    }
    button{
        outline: none;
        border: none;
        background: none;
        cursor: pointer;
    }
    .MuiDataGrid-scrollbar--horizontal {
        left: 0;
    }
    .MuiDayCalendar-root *{
        font-size: 1.2rem;
    }

     .sum-row-bg {
        background-color: #cc333344 !important;
    }
`;
