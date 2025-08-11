// models/QuarterSales.js
// CommonJS (RegionCode.js와 동일 스타일)
module.exports = (sequelize, DataTypes) => {
    const QuarterSales = sequelize.define(
        "QuarterSales",
        {
            // --- PK (로더가 만든 id BIGINT AUTO_INCREMENT PRIMARY KEY) ---
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                field: "id",
            },

            // --- 식별/키 성격 컬럼 ---
            year_quarter: {
                type: DataTypes.STRING(20),
                field: "기준_년분기_코드",
                allowNull: false,
            },
            biz_area_type_code: {
                type: DataTypes.STRING(10),
                field: "상권_구분_코드",
            },
            biz_area_type_name: {
                type: DataTypes.STRING(50),
                field: "상권_구분_코드_명",
            },

            // 로더에서 VARCHAR(20)로 생성
            hinterland_code: {
                type: DataTypes.STRING(20),
                field: "상권배후지_코드",
                allowNull: false,
            },
            hinterland_name: {
                type: DataTypes.STRING(100),
                field: "상권배후지_코드_명",
            },
            service_code: {
                type: DataTypes.STRING(20),
                field: "서비스_업종_코드",
                allowNull: false,
            },
            service_name: {
                type: DataTypes.STRING(100),
                field: "서비스_업종_코드_명",
            },

            // --- 금액 (BIGINT: JS에서 문자열로 반환될 수 있음 주의) ---
            sales_amt: { type: DataTypes.BIGINT, field: "당월_매출_금액" },
            weekday_amt: { type: DataTypes.BIGINT, field: "주중_매출_금액" },
            weekend_amt: { type: DataTypes.BIGINT, field: "주말_매출_금액" },
            mon_amt: { type: DataTypes.BIGINT, field: "월요일_매출_금액" },
            tue_amt: { type: DataTypes.BIGINT, field: "화요일_매출_금액" },
            wed_amt: { type: DataTypes.BIGINT, field: "수요일_매출_금액" },
            thu_amt: { type: DataTypes.BIGINT, field: "목요일_매출_금액" },
            fri_amt: { type: DataTypes.BIGINT, field: "금요일_매출_금액" },
            sat_amt: { type: DataTypes.BIGINT, field: "토요일_매출_금액" },
            sun_amt: { type: DataTypes.BIGINT, field: "일요일_매출_금액" },

            t00_06_amt: {
                type: DataTypes.BIGINT,
                field: "시간대_00~06_매출_금액",
            },
            t06_11_amt: {
                type: DataTypes.BIGINT,
                field: "시간대_06~11_매출_금액",
            },
            t11_14_amt: {
                type: DataTypes.BIGINT,
                field: "시간대_11~14_매출_금액",
            },
            t14_17_amt: {
                type: DataTypes.BIGINT,
                field: "시간대_14~17_매출_금액",
            },
            t17_21_amt: {
                type: DataTypes.BIGINT,
                field: "시간대_17~21_매출_금액",
            },
            t21_24_amt: {
                type: DataTypes.BIGINT,
                field: "시간대_21~24_매출_금액",
            },

            male_amt: { type: DataTypes.BIGINT, field: "남성_매출_금액" },
            female_amt: { type: DataTypes.BIGINT, field: "여성_매출_금액" },

            age10_amt: { type: DataTypes.BIGINT, field: "연령대_10_매출_금액" },
            age20_amt: { type: DataTypes.BIGINT, field: "연령대_20_매출_금액" },
            age30_amt: { type: DataTypes.BIGINT, field: "연령대_30_매출_금액" },
            age40_amt: { type: DataTypes.BIGINT, field: "연령대_40_매출_금액" },
            age50_amt: { type: DataTypes.BIGINT, field: "연령대_50_매출_금액" },
            age60p_amt: {
                type: DataTypes.BIGINT,
                field: "연령대_60_이상_매출_금액",
            },

            // --- 건수 (INT) ---
            sales_cnt: { type: DataTypes.INTEGER, field: "당월_매출_건수" },
            weekday_cnt: { type: DataTypes.INTEGER, field: "주중_매출_건수" },
            weekend_cnt: { type: DataTypes.INTEGER, field: "주말_매출_건수" },
            mon_cnt: { type: DataTypes.INTEGER, field: "월요일_매출_건수" },
            tue_cnt: { type: DataTypes.INTEGER, field: "화요일_매출_건수" },
            wed_cnt: { type: DataTypes.INTEGER, field: "수요일_매출_건수" },
            thu_cnt: { type: DataTypes.INTEGER, field: "목요일_매출_건수" },
            fri_cnt: { type: DataTypes.INTEGER, field: "금요일_매출_건수" },
            sat_cnt: { type: DataTypes.INTEGER, field: "토요일_매출_건수" },
            sun_cnt: { type: DataTypes.INTEGER, field: "일요일_매출_건수" },

            // 원본 헤더 그대로(특수문자 포함)
            t00_06_cnt: {
                type: DataTypes.INTEGER,
                field: "시간대_건수~06_매출_건수",
            },
            t06_11_cnt: {
                type: DataTypes.INTEGER,
                field: "시간대_건수~11_매출_건수",
            },
            t11_14_cnt: {
                type: DataTypes.INTEGER,
                field: "시간대_건수~14_매출_건수",
            },
            t14_17_cnt: {
                type: DataTypes.INTEGER,
                field: "시간대_건수~17_매출_건수",
            },
            t17_21_cnt: {
                type: DataTypes.INTEGER,
                field: "시간대_건수~21_매출_건수",
            },
            t21_24_cnt: {
                type: DataTypes.INTEGER,
                field: "시간대_건수~24_매출_건수",
            },

            male_cnt: { type: DataTypes.INTEGER, field: "남성_매출_건수" },
            female_cnt: { type: DataTypes.INTEGER, field: "여성_매출_건수" },

            age10_cnt: {
                type: DataTypes.INTEGER,
                field: "연령대_10_매출_건수",
            },
            age20_cnt: {
                type: DataTypes.INTEGER,
                field: "연령대_20_매출_건수",
            },
            age30_cnt: {
                type: DataTypes.INTEGER,
                field: "연령대_30_매출_건수",
            },
            age40_cnt: {
                type: DataTypes.INTEGER,
                field: "연령대_40_매출_건수",
            },
            age50_cnt: {
                type: DataTypes.INTEGER,
                field: "연령대_50_매출_건수",
            },
            age60p_cnt: {
                type: DataTypes.INTEGER,
                field: "연령대_60_이상_매출_건수",
            },
        },
        {
            tableName: "seoul-dataview",
            freezeTableName: true,
            timestamps: false,
            charset: "utf8mb4",
            collate: "utf8mb4_general_ci",

            // 인덱스는 로더에서 이미 생성했으므로 여기선 생략(중복 생성 방지)
            // 필요 시 아래 주석 해제 가능
            // indexes: [
            //   { fields: ["기준_년분기_코드"] },
            //   { fields: ["상권배후지_코드"] },
            //   { fields: ["서비스_업종_코드"] },
            //   { fields: ["기준_년분기_코드", "상권배후지_코드", "서비스_업종_코드"] },
            // ],
        }
    );

    return QuarterSales;
};
