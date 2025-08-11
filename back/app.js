// server.js
const express = require("express");
const cors = require("cors");
const db = require("./models");
const http = require("http");

const localRouter = require("./routers/local");
const quarterSaleRouter = require("./routers/quarter");

const app = express();
const PORT = 5500;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

db.sequelize
    .sync()
    .then(() => {
        console.log("db 연결 성공");
    })
    .catch(console.error);

//CORS 설정
app.use(
    cors({
        origin: ["http://localhost:8080", "http://172.30.40.34:8080"],
        credentials: true,
    })
);

//라우터 분리
app.use("/local", localRouter);
app.use("/quarter-sale", quarterSaleRouter);

app.get("/", (req, res) => {
    res.send("hello express");
});

app.listen(PORT, () => {
    console.log(`프록시 서버가 포트 ${PORT}에서 실행 중`);
});
