// routers/quater.js
const express = require("express");
const router = express.Router();
const { sequelize, QuarterSales, RegionCode } = require("../models");
const { fn, col, Op } = require("sequelize");

function parseMulti(v) {
    if (v == null) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === "string")
        return v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    return [];
}

// 1) 컬럼 들고오기
router.get("/columns", async (_req, res) => {
    try {
        // 1) Sequelize 모델 속성 메타 (attr ↔ field)
        const modelAttrs = Object.entries(QuarterSales.rawAttributes).map(
            ([attr, def]) => ({
                attr, // 모델에서 쓰는 영문 키
                field: def.field || attr, // 실제 DB 컬럼명
                type: def.type?.key || String(def.type),
                allowNull: def.allowNull !== false,
                primaryKey: !!def.primaryKey,
                autoIncrement: !!def.autoIncrement,
            })
        );

        // 2) DB 테이블 스키마 (describeTable)
        const qi = sequelize.getQueryInterface();
        const tableName = QuarterSales.getTableName(); // 'seoul-dataview'
        const desc = await qi.describeTable(tableName); // { colName: {type, allowNull, ...} }

        const dbColumns = Object.entries(desc).map(([field, meta]) => ({
            field,
            ...meta,
        }));

        // 3) 리스트 형태로도 제공
        const modelAttrNames = modelAttrs.map((x) => x.attr);
        const dbFieldNames = dbColumns.map((x) => x.field);

        const result = {
            status: { code: 200, msg: "success" },
            data: {
                // model_attributes: modelAttrs,
                // db_columns: dbColumns,
                lists: {
                    model_attr_names: modelAttrNames,
                    db_field_names: dbFieldNames,
                },
            },
            meta: { table: tableName },
        };

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

/**
 * GET /quarter-sale/list
 * query:
 *  - district_code (gu) : string (필수) 자치구코드
 *  - town_code (dong)   : string (필수) 행정동코드
 *  - year_quarter       : number (필수) 기간코드
 *  - service_code       : string|string[] (선택)  ex) ?service_code=CS100001,CS300021
 *  - hinterland_code    : string|string[] (선택)  ex) ?hinterland_code=3110652,3110999
 */
router.get("/list", async (req, res) => {
    const { district_code, town_code, year_quarter } = req.query;
    // const limit = Number(req.query.limit ?? 300);
    const offset = Number(req.query.offset ?? 0);

    // 필수 파라미터 체크
    if (!district_code || !town_code || !year_quarter) {
        return res.status(400).json({
            error: "district_code, town_code, year_quarter are required",
        });
    }

    try {
        // 1) 행정동/자치구 → 상권배후지_구분_코드 목록(distinct)
        const areaRows = await RegionCode.findAll({
            attributes: [
                [
                    fn("DISTINCT", col("상권배후지_구분_코드")),
                    "commercial_area_code",
                ],
            ],
            where: { district_code, town_code },
            raw: true,
        });
        const areaFromRegion = areaRows
            .map((r) => r.commercial_area_code)
            .filter(Boolean);

        // console.log("areaFromRegion", areaFromRegion);

        // 2) 선택 파라미터 처리
        const svcCodes = parseMulti(req.query.service_code); // 서비스 업종
        const areaParam = parseMulti(req.query.hinterland_code); // 상권배후지 코드

        // 최종 상권배후지 = RegionCode 기준 + 파라미터의 합집합(OR)
        const finalAreas = Array.from(
            new Set([...(areaFromRegion || []), ...(areaParam || [])])
        );

        // console.log("finalAreas", finalAreas);

        // 3) QuarterSales where 조건
        const where = { year_quarter: year_quarter.trim() };
        if (finalAreas.length > 0)
            where.hinterland_code = { [Op.in]: finalAreas };
        if (svcCodes.length > 0) where.service_code = { [Op.in]: svcCodes };

        // 4) 조회
        // console.log("where>>>", where);
        const rows = await QuarterSales.findAll({
            where,
            order: [
                ["service_name", "ASC"],
                ["hinterland_code", "ASC"],
            ],
            // limit,
            offset,
            // raw: true, // 원하면 활성화
        });

        return res.json({
            status: { code: 200, msg: "success" },
            data: rows,
            meta: {
                district_code,
                town_code,
                year_quarter: Number(year_quarter),
                area_from_region_count: areaFromRegion.length,
                area_param_count: areaParam.length,
                area_final_count: finalAreas.length,
                service_code_count: svcCodes.length,
                count: rows.length,
                // limit,
                offset,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "DB error" });
    }
});
module.exports = router;
