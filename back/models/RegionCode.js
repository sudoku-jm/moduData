// models/RegionCode.js
module.exports = (sequelize, DataTypes) => {
    const RegionCode = sequelize.define(
        "RegionCode",
        {
            commercial_area_code: {
                type: DataTypes.STRING(20),
                field: "상권배후지_구분_코드",
            },
            commercial_area_name: {
                type: DataTypes.STRING(100),
                field: "상권배후지_구분_코드_명",
            },
            x_coord: { type: DataTypes.STRING(50), field: "엑스좌표_값" },
            y_coord: { type: DataTypes.STRING(50), field: "와이좌표_값" },
            district_code: { type: DataTypes.STRING(10), field: "자치구_코드" },
            district_name: {
                type: DataTypes.STRING(50),
                field: "자치구_코드_명",
            },
            town_code: { type: DataTypes.STRING(20), field: "행정동_코드" },
            town_name: { type: DataTypes.STRING(50), field: "행정동_코드_명" },
            area_size: { type: DataTypes.STRING(50), field: "영역_면적" },
        },
        {
            tableName: "region_code",
            freezeTableName: true,
            timestamps: false,
        }
    );

    return RegionCode;
};
