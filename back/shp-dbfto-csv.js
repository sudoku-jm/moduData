// shp-dbfto-csv.js
import * as shapefile from "shapefile";
import fs from "fs";

const SHP = "./data/seoul-commercial-catchment.shp";
const DBF = "./data/seoul-commercial-catchment.dbf";
const OUT = "./data/output.csv";

// 필요 컬럼만 뽑고 싶으면 여기에 이름 적기 (비워두면 전부)
const PICK = [
    "상권배우지_구분_코드",
    "상권배후지_구분_코드_명",
    "자치구_코드",
    "자치구_코드_명",
];

// DBF가 CP949일 수도 있어서 인코딩 옵션 맞춰주기
const ENCODING = "utf-8"; // CP949라면 "cp949"

function toCsvRow(obj, header) {
    return header
        .map((k) => obj?.[k] ?? "")
        .map((v) => `"${String(v).replace(/"/g, '""')}"`) // CSV 안전 처리
        .join(",");
}

(async () => {
    const source = await shapefile.open(SHP, DBF, { encoding: ENCODING });

    const rows = [];
    let header = null;

    for (let r = await source.read(); !r.done; r = await source.read()) {
        const props = r.value.properties;

        // 첫 레코드에서 헤더 결정
        if (!header) {
            header = PICK?.length ? PICK : Object.keys(props);
            rows.push(header.join(","));
        }

        rows.push(toCsvRow(props, header));
    }

    if (!header) {
        console.log("레코드가 없습니다.");
        return;
    }

    fs.writeFileSync(OUT, rows.join("\n"), "utf8");
    console.log(`✅ 변환 완료 → ${OUT}`);
})();
