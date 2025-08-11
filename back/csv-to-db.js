// csv-to-db.js  (ESM: package.json에 "type":"module" 유지)
import fs from "fs";
import { parse } from "csv-parse";
import mysql from "mysql2/promise";

/** ===== 설정 ===== */
const CSV_PATH = "./data/seoul-commercial-catchment.csv";
const DB_NAME = "seoul";
const TABLE = "region_code";
const DB = {
    host: "127.0.0.1",
    user: "root",
    password: "1234",
    database: DB_NAME,
};

const DEFAULT_TYPE = "TEXT"; // 길이 초과 방지용
const BATCH_SIZE = 300; // 실패 지점 추적 쉬움
const DROP_TABLE_FIRST = false; // 테이블 날리고 새로 만들려면 true

/** ===== 유틸 ===== */
const qid = (name) => `\`${name.replace(/`/g, "``")}\``;
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

async function readCsvHeader(csvPath) {
    return new Promise((resolve, reject) => {
        const rs = fs.createReadStream(csvPath).pipe(parse({ to_line: 1 }));
        rs.on("data", (row) => resolve(row.map(stripBOM)));
        rs.on("error", reject);
    });
}

function getCsvRowStream(csvPath, header) {
    return fs.createReadStream(csvPath).pipe(
        parse({
            columns: header, // 정리된 헤더 고정
            trim: true,
            skip_empty_lines: true,
            from_line: 2,
        })
    );
}

async function ensureTable(conn, tableName, header) {
    if (DROP_TABLE_FIRST) {
        await conn.execute(`DROP TABLE IF EXISTS ${qid(tableName)}`);
    }
    const columnsSql = header
        .map((col) => `${qid(col)} ${DEFAULT_TYPE}`)
        .join(", ");
    const sql = `
    CREATE TABLE IF NOT EXISTS ${qid(tableName)} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ${columnsSql}
    ) CHARACTER SET utf8mb4
  `;
    await conn.execute(sql);
}

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

// 배치 → 실패 시 행 단위 재시도. 문제행은 bad_rows.log에 남기고 continue
async function safeInsertBatch(conn, tableName, header, batch, offsetIdx = 0) {
    try {
        await insertBatch(conn, tableName, header, batch);
        return { ok: batch.length, bad: 0 };
    } catch (e) {
        let ok = 0,
            bad = 0;
        for (let i = 0; i < batch.length; i++) {
            try {
                await insertBatch(conn, tableName, header, [batch[i]]);
                ok++;
            } catch (rowErr) {
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
    const rawHeader = await readCsvHeader(CSV_PATH);
    if (!rawHeader?.length) throw new Error("CSV 헤더를 읽지 못했습니다.");

    const header = dedupeColumns(rawHeader);
    const conn = await mysql.createConnection(DB);
    await ensureTable(conn, TABLE, header);

    const parser = getCsvRowStream(CSV_PATH, header);

    let batch = [];
    let totalOk = 0,
        totalBad = 0,
        idx = 0;

    for await (const row of parser) {
        const values = header.map((c) =>
            row[c] === "" ? null : row[c] ?? null
        );
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
        `✅ DONE: DB=${DB_NAME}, TABLE=${TABLE}, OK_ROWS=${totalOk}, BAD_ROWS=${totalBad}`
    );
    if (totalBad > 0) console.log("⚠ 일부 행 실패 → bad_rows.log 확인");
}

main().catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
});
