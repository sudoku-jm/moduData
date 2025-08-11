import axios from "axios";
import { CS_URL, SSR_API_URL } from "../config/config";
import { all, fork } from "redux-saga/effects";
// import pageSaga from "./page";

export default function* rootSaga() {
    axios.defaults.baseURL = CS_URL;
    axios.defaults.withCredentials = true;
    // yield all([fork(pageSaga)]);
}

//서버사이드 랜더링(SSR) 사용
export const configSSR = axios.create({
    baseURL: SSR_API_URL,
    withCredentials: true,
    // headers: {
    //     Cookie: data.cookies !== undefined ? data.cookies : "",
    // },
});
