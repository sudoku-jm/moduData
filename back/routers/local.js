// routers/local.js
const express = require("express");
const router = express.Router();
const { RegionCode, QuarterSales } = require("../models");
const { Op } = require("sequelize");

// 1) 자치구 목록 (중복 없이)
router.get("/gu", async (_req, res) => {
    try {
        const rows = await RegionCode.findAll({
            attributes: ["district_code", "district_name"],
            group: ["district_code", "district_name"],
            order: [["district_name", "ASC"]],
            raw: true,
        });
        const result = {
            status: {
                code: 200,
                msg: "success",
            },
            data: rows, //[{ district_code:'11110', district_name:'종로구' }, ...]
        };
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

// 2) 자치구 선택 -> 행정동(코드/명)
router.get("/dong", async (req, res) => {
    const { gu } = req.query;
    if (!gu) return res.status(400).json({ error: "gu required" });

    try {
        const rows = await RegionCode.findAll({
            attributes: ["town_code", "town_name"], // field 매핑: 행정동_코드 / 행정동_코드_명
            where: { district_code: gu }, // field 매핑: 자치구_코드
            group: ["town_code", "town_name"], // 중복 제거
            order: [["town_name", "ASC"]],
            raw: true,
        });

        return res.json({
            status: { code: 200, msg: "success" },
            data: rows, // [{ town_code: '11110510', town_name: '청운효자동' }, ...]
            meta: { gu, count: rows.length },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB error" });
    }
});

// 3)행정동 코드로 -> 서비스업종 들고오기

/**
 * GET /service_code?s=20251&town_code=xxxxx
 * - 행정동(town_code) → 연결된 상권배후지코드들
 * - 그 범위에서 해당 분기의 서비스 업종(코드/명) 목록을 "중복 없이" 반환
 */
router.get("/service_code", async (req, res) => {
    const { town_code, s: year_quarter } = req.query;

    if (!town_code) {
        return res.status(400).json({ error: "town_code required" });
    }
    if (!year_quarter) {
        return res.status(400).json({ error: "s (year_quarter) required" });
    }

    try {
        // 1) 행정동 → 상권배후지 code+name 목록 (중복 제거)
        const areas = await RegionCode.findAll({
            attributes: [
                "commercial_area_code", // field: 상권배후지_구분_코드
                "commercial_area_name", // field: 상권배후지_구분_코드_명
            ],
            where: { town_code }, // field: 행정동_코드
            group: ["commercial_area_code", "commercial_area_name"],
            order: [["commercial_area_name", "ASC"]],
            raw: true,
        });

        const areaCodes = areas
            .map((a) => a.commercial_area_code)
            .filter(Boolean);
        if (areaCodes.length === 0) {
            return res.json({
                status: { code: 200, msg: "success" },
                data: { areas: [], services: [] },
                meta: {
                    count: 0,
                    message: "no commercial_area_code for town_code",
                },
            });
        }

        // 2) 해당 분기 + 상권배후지 코드들 범위에서 서비스업종(코드/명)만 중복 없이
        const services = await QuarterSales.findAll({
            attributes: ["service_code", "service_name"],
            where: {
                year_quarter: Number(year_quarter),
                hinterland_code: { [Op.in]: areaCodes }, // field: 상권배후지_코드
            },
            group: ["service_code", "service_name"],
            order: [["service_name", "ASC"]],
            raw: true,
        });

        return res.json({
            status: { code: 200, msg: "success" },
            data: {
                areas, // [{ commercial_area_code, commercial_area_name }, ...]
                services, // [{ service_code, service_name }, ...]
            },
            meta: {
                town_code,
                year_quarter: Number(year_quarter),
                area_count: areas.length,
                service_count: services.length,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "DB error" });
    }
});

module.exports = router;
