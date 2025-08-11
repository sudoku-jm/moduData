// csv-to-db.js  (ESM: package.json에 "type":"module" 필요)
import fs from "fs";
import { parse } from "csv-parse";
import mysql from "mysql2/promise";
import iconv from "iconv-lite";

/** ===== 설정 ===== */
const CSV_PATH = "./data/seoul-20251.csv";
const DB_NAME = "seoul";
const TABLE = "seoul-dataview"; // 하이픈 OK (qid로 이스케이프)
const DB = {
    host: "127.0.0.1",
    user: "root",
    password: "1234",
    database: DB_NAME,
};

let BATCH_SIZE = 300; // 패킷 초과 시 자동 축소
const DROP_TABLE_FIRST = true; // 처음만 true로. 이후 누적 적재 시 false
const FORCE_ENCODING = null; // "utf8" | "cp949" | null(자동 판별)
const DEFAULT_TYPE = "TEXT"; // 규칙에 안 걸리면 TEXT로

/** ===== 유틸 ===== */
const qid = (name) => `\`${String(name).replace(/`/g, "``")}\``;
const stripBOM = (s) => (typeof s === "string" ? s.replace(/^\uFEFF/, "") : s);

function dedupeColumns(cols) {
    const seen = new Map();
    return cols.map((raw) => {
        const base = stripBOM(String(raw ?? "").trim() || "col");
        if (!seen.has(base)) {
            seen.set(base, 1);
            return base;
        }
        let n = seen.get(base) + 1;
        seen.set(base, n);
        let cand = `${base}_${n}`;
        while (seen.has(cand)) {
            n++;
            cand = `${base}_${n}`;
        }
        seen.set(cand, 1);
        return cand;
    });
}

/** 구분자 감지: 콤마 vs 탭 */
function detectDelimiter(sampleLine) {
    const c = (sampleLine.match(/,/g) || []).length;
    const t = (sampleLine.match(/\t/g) || []).length;
    return t > c ? "\t" : ",";
}

/** 간단 인코딩 스니핑 */
function sniffEncoding(path) {
    const buf = fs.readFileSync(path, { flag: "r" }).subarray(0, 64 * 1024);
    if (
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
    )
        return "utf8";
    const txt = buf.toString("utf8");
    const repl = (txt.match(/\uFFFD/g) || []).length;
    return repl > 5 ? "cp949" : "utf8";
}

/** 인코딩 디코딩 스트림 */
function createDecodedStream(path) {
    const enc = FORCE_ENCODING || sniffEncoding(path);
    const rs = fs.createReadStream(path);
    return enc === "utf8" ? rs : rs.pipe(iconv.decodeStream(enc));
}

async function readCsvHeader(csvPath) {
    const head = fs.readFileSync(csvPath).toString("binary");
    const firstLine = head.split(/\r?\n/)[0] || "";
    const delimiter = detectDelimiter(firstLine);

    return new Promise((resolve, reject) => {
        const rs = createDecodedStream(csvPath).pipe(
            parse({ to_line: 1, delimiter, bom: true })
        );
        rs.on("data", (row) =>
            resolve({ header: row.map(stripBOM), delimiter })
        );
        rs.on("error", reject);
    });
}

function getCsvRowStream(csvPath, header, delimiter) {
    return createDecodedStream(csvPath).pipe(
        parse({
            columns: header,
            trim: true,
            skip_empty_lines: true,
            from_line: 2,
            delimiter,
            bom: true,
            relax_column_count: true,
        })
    );
}

/** === 타입 추론 규칙 ===
 * - 기준_년분기_코드 → TEXT
 * - 상권배후지_코드, 서비스_업종_코드 → VARCHAR(20)
 * - *_건수(포함) → INT
 * - *_금액(포함) → BIGINT
 * - 나머지 → TEXT
 */
function inferSqlType(col) {
    if (col === "기준_년분기_코드") return "TEXT";
    if (col === "상권배후지_코드" || col === "서비스_업종_코드")
        return "VARCHAR(20)";
    if (/건수/.test(col)) return "INT";
    if (/금액/.test(col)) return "BIGINT";
    return DEFAULT_TYPE;
}

/** 숫자 컬럼 집합(INSERT 시 캐스팅용) */
function buildNumericSets(header) {
    const intCols = new Set();
    const bigIntCols = new Set();
    for (const col of header) {
        const t = inferSqlType(col);
        if (t === "INT") intCols.add(col);
        else if (t === "BIGINT") bigIntCols.add(col);
    }
    return { intCols, bigIntCols };
}

/** 테이블 생성 */
async function ensureTable(conn, tableName, header) {
    if (DROP_TABLE_FIRST)
        await conn.execute(`DROP TABLE IF EXISTS ${qid(tableName)}`);

    const columnsSql = header
        .map((col) => `${qid(col)} ${inferSqlType(col)}`)
        .join(", ");
    const sql = `
    CREATE TABLE IF NOT EXISTS ${qid(tableName)} (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ${columnsSql}
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_general_ci
  `;
    await conn.execute(sql);

    // 인덱스(있으면 무시)
    const tryIdx = async (name, cols) => {
        try {
            await conn.execute(
                `CREATE INDEX ${qid(name)} ON ${qid(tableName)} (${cols
                    .map(qid)
                    .join(",")})`
            );
        } catch (_) {}
    };
    await tryIdx("idx_yq", ["기준_년분기_코드"]);
    await tryIdx("idx_area", ["상권배후지_코드"]);
    await tryIdx("idx_service", ["서비스_업종_코드"]);
    await tryIdx("idx_yq_area_service", [
        "기준_년분기_코드",
        "상권배후지_코드",
        "서비스_업종_코드",
    ]);
}

/** INSERT (배치) */
async function insertBatch(conn, tableName, header, batch) {
    if (!batch.length) return;
    const cols = header.map(qid).join(",");
    const placeholders = batch
        .map(() => `(${header.map(() => "?").join(",")})`)
        .join(",");
    const values = batch.flat();
    const sql = `INSERT INTO ${qid(
        tableName
    )} (${cols}) VALUES ${placeholders}`;
    await conn.execute(sql, values);
}

/** 안전 배치: 패킷 초과 시 분할, 실패행 로깅 */
async function safeInsertBatch(conn, tableName, header, batch, offsetIdx = 0) {
    if (!batch.length) return { ok: 0, bad: 0 };
    try {
        await conn.beginTransaction();
        await insertBatch(conn, tableName, header, batch);
        await conn.commit();
        return { ok: batch.length, bad: 0 };
    } catch (e) {
        await conn.rollback();

        if (
            /packet|Too\s+long|ER_NET_PACKET/i.test(e.message) &&
            batch.length > 1
        ) {
            BATCH_SIZE = Math.max(50, Math.floor(BATCH_SIZE / 2));
            const mid = Math.floor(batch.length / 2);
            const a = await safeInsertBatch(
                conn,
                tableName,
                header,
                batch.slice(0, mid),
                offsetIdx
            );
            const b = await safeInsertBatch(
                conn,
                tableName,
                header,
                batch.slice(mid),
                offsetIdx + mid
            );
            return { ok: a.ok + b.ok, bad: a.bad + b.bad };
        }

        let ok = 0,
            bad = 0;
        for (let i = 0; i < batch.length; i++) {
            try {
                await conn.beginTransaction();
                await insertBatch(conn, tableName, header, [batch[i]]);
                await conn.commit();
                ok++;
            } catch (rowErr) {
                await conn.rollback();
                bad++;
                const line = JSON.stringify({
                    index: offsetIdx + i,
                    error: rowErr.message,
                    values: batch[i],
                });
                fs.appendFileSync("./bad_rows.log", line + "\n");
            }
        }
        return { ok, bad };
    }
}

/** ===== 메인 ===== */
async function main() {
    const { header: rawHeader, delimiter } = await readCsvHeader(CSV_PATH);
    if (!rawHeader?.length) throw new Error("CSV 헤더를 읽지 못했습니다.");
    const header = dedupeColumns(rawHeader); // 원문 유지 + 중복 정리
    const { intCols, bigIntCols } = buildNumericSets(header);

    const conn = await mysql.createConnection({
        ...DB,
        multipleStatements: false,
    });
    await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");

    await ensureTable(conn, TABLE, header);
    const parser = getCsvRowStream(CSV_PATH, header, delimiter);

    let batch = [];
    let totalOk = 0,
        totalBad = 0,
        idx = 0;

    for await (const row of parser) {
        const values = header.map((c) => {
            const v = row[c];
            if (v === "" || v == null) return null;

            // 숫자 컬럼은 정수로 캐스팅 (쉼표/공백 제거)
            if (intCols.has(c) || bigIntCols.has(c)) {
                const n = String(v).replace(/[, ]/g, "");
                // 숫자 아닌 값 섞여도 NULL 처리
                return /^\d+$/.test(n) ? n : null;
            }
            return v;
        });

        batch.push(values);

        if (batch.length >= BATCH_SIZE) {
            const { ok, bad } = await safeInsertBatch(
                conn,
                TABLE,
                header,
                batch,
                idx - batch.length + 1
            );
            totalOk += ok;
            totalBad += bad;
            batch = [];
            if ((totalOk + totalBad) % (BATCH_SIZE * 10) === 0) {
                console.log(
                    `...progress rows=${
                        totalOk + totalBad
                    }, ok=${totalOk}, bad=${totalBad}, batch=${BATCH_SIZE}`
                );
            }
        }
        idx++;
    }

    if (batch.length) {
        const { ok, bad } = await safeInsertBatch(
            conn,
            TABLE,
            header,
            batch,
            idx - batch.length
        );
        totalOk += ok;
        totalBad += bad;
    }

    await conn.end();
    console.log(
        `✅ DONE: DB=${DB_NAME}, TABLE=${TABLE}, OK_ROWS=${totalOk}, BAD_ROWS=${totalBad}, delim=${JSON.stringify(
            delimiter
        )}, batch=${BATCH_SIZE}`
    );
    if (totalBad > 0) console.log("⚠ 일부 행 실패 → bad_rows.log 확인");
}

main().catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
});
