import React, { useCallback, useState } from "react";
import {
    Box,
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Button,
    ButtonGroup,
} from "@mui/material";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Tooltip,
    Title,
    ArcElement,
} from "chart.js";
import ReactSelect from "react-select";
import { CheckboxForm } from "../styles/FormStyle";
import { useEffect } from "react";
import {
    columnMap,
    EXCLUDED_COLUMNS,
    HIDDEN_COLUMNS,
    SUM_EXCLUDED_COLUMNS,
} from "../func/colList";
import { chartOptions, QUARTERS } from "../func/datas";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Tooltip,
    Title,
    ArcElement
);

export default function HomePage() {
    const [columnList, setColumnList] = useState([]); //기본 컬럼

    const [rawData, setRawData] = useState([]); //기본 데이터
    const [filteredData, setFilteredData] = useState([]); //리스트 데이터

    const [selectedColumns, setSelectedColumns] = useState([]); // 리스트/차트 체크 컬럼
    const [chartData, setChartData] = useState(null);

    //로딩
    const [loading, setLoading] = useState({
        cvsLoading: false,
        chartLoading: false,
    });
    const [chartType, setChartType] = useState("bar"); //bar , pie
    const [isSearched, setIsSearched] = useState(false);
    //selected
    const [quarterList, setQuarterList] = useState(QUARTERS); //기본 분기값
    const [selectedQuarter, setSelectedQuarter] = useState(""); //선택한 분기

    const [guOptions, setGuOptions] = useState([]); //선택한 자치구
    const [selectedGu, setSelectedGu] = useState(null); //선택한 자치구

    const [dongOptions, setDongOptions] = useState([]); //행정동
    const [selectedDong, setSelectedDong] = useState(null); //선택한 행정동

    const [regionList, setRegionList] = useState([]); //행정동 > 상권 리스트
    const [selectedRegions, setSelectedRegions] = useState(null); //선택한 상권배후지

    const [serviceList, setServiceList] = useState([]); //서비스 업종 리스트
    const [selectedServices, setSelectedServices] = useState(null); //선택한 서비스업종

    const [selectedCatchment, setSelectedCatchment] = useState(null);

    const handleResetSearch = () => {
        setLoading({
            ...loading,
            chartLoading: true,
        });

        setChartType("bar");
        // setGuOptions([]);
        setSelectedGu(null);

        setDongOptions([]);
        setSelectedDong(null);

        setSelectedRegions(null);
        setSelectedServices(null);
        setServiceList([]);
        setRegionList([]);

        setColumnList([]);
        setSelectedColumns([]);
        setChartData(null);
        setRawData([]);
        setFilteredData([]);

        setLoading({
            ...loading,
            chartLoading: false,
        });
    };

    const excludColum = (datas) => {
        // console.log("excludColum datas>>", datas);
        const colName = datas?.db_field_names;
        const columns = colName.filter(
            (col) => !EXCLUDED_COLUMNS.includes(col)
        );

        // 세션스토리지에 저장
        // JSON.stringify로 배열을 문자열로 변환해서 저장
        sessionStorage.setItem("columnList", JSON.stringify(datas));
        setColumnList(columns);
    };

    const getGuDatas = async () => {
        //자치구 데이터 가져오기
        let guOptions = [];
        const getSessionStorageGu = sessionStorage.getItem("seoulGuList");
        if (!getSessionStorageGu) {
            await fetch("http://localhost:5500/local/gu")
                .then((r) => r.json())
                .then((json) => {
                    const code = json.status.code;
                    if (code == 200) {
                        const list = json.data;
                        // console.log("list>>", list);
                        if (list.length > 0) {
                            // 세션스토리지에 저장
                            // JSON.stringify로 배열을 문자열로 변환해서 저장
                            sessionStorage.setItem(
                                "seoulGuList",
                                JSON.stringify(list)
                            );
                            guOptions = list.map((x) => ({
                                value: x.district_code,
                                label: x.district_name,
                            }));
                        }
                    }
                })
                .catch(console.error);
        } else {
            const guDatas = JSON.parse(getSessionStorageGu);
            guOptions = guDatas.map((x) => ({
                value: x.district_code,
                label: x.district_name,
            }));
        }

        setGuOptions(guOptions);
    };

    const handleQuarterChange = async (e) => {
        const value = e.target.value;
        setSelectedQuarter(value);

        // 자치구 데이터 API 호출
        getGuDatas();
    };

    const handleGuChange = async (opt) => {
        if (!opt) {
            setSelectedGu(null);
            setSelectedColumns([]);
            setSelectedCatchment(null);
            return;
        }
        setDongOptions([]);
        setSelectedDong(null);
        setSelectedRegions(null);
        setSelectedServices(null);
        setServiceList([]);
        setRegionList([]);
        if (!opt) return;
        setSelectedGu(opt);

        // 자치구 하위 데이터 조회
        await fetch(`http://localhost:5500/local/dong?gu=${opt.value}`)
            .then((r) => r.json())
            .then((json) => {
                const code = json.status.code;

                if (code == 200) {
                    // 행정동 셋팅
                    // 상권 목록은 행정동 선택 후 필터링해서 세팅
                    const list = json.data;
                    if (list.length > 0) {
                        //데이터 옵션용으로 변경.
                        const dongs = Array.from(
                            new Map(
                                list.map((r) => [r.town_code, r.town_name])
                            ).entries()
                        ).map(([code, name]) => ({ value: code, label: name }));
                        setDongOptions(dongs);
                    }
                }
            })
            .catch(console.error);
    };

    const handleDongChange = useCallback(
        async (opt) => {
            if (!opt) {
                setSelectedDong(null);
                setSelectedColumns([]);
                setSelectedCatchment(null);
                return;
            }
            setSelectedDong(opt);
            setSelectedRegions(null);
            setSelectedServices(null);
            setServiceList([]);
            setRegionList([]);

            //서비스업종 불러오기
            await fetch(
                `http://localhost:5500/local/service_code?s=${selectedQuarter}&town_code=${opt.value}`
            )
                .then((r) => r.json())
                .then((json) => {
                    // console.log(json);
                    const code = json.status.code;

                    if (code == 200) {
                        const list = json.data;
                        const serviceList = list?.services;
                        const areasList = list?.areas;
                        // console.log("serviceList", serviceList);
                        // console.log("areasList", areasList);
                        setRegionList(
                            areasList?.map((f) => ({
                                value: f.commercial_area_code,
                                label: f.commercial_area_name,
                            }))
                        );
                        setServiceList(
                            serviceList?.map((f) => ({
                                value: f.service_code,
                                label: f.service_name,
                            }))
                        );

                        //차트 및 리스트용 컬럼명 들고오기.
                    }
                })
                .catch(console.error);

            //차트 및 리스트용 컬럼명 들고오기.
            const getSessionStorageCol = sessionStorage.getItem("columnList");
            if (!getSessionStorageCol) {
                await fetch(`http://localhost:5500/quarter-sale/columns`)
                    .then((r) => r.json())
                    .then((json) => {
                        // console.log(json);
                        const code = json.status.code;
                        if (code == 200) {
                            const cols = json.data?.lists;
                            excludColum(cols); //컬럼셋팅(예외컬럼삭제)
                        }
                    });
            } else {
                excludColum(JSON.parse(getSessionStorageCol)); //컬럼셋팅(예외컬럼삭제)
            }
        },
        [selectedQuarter]
    );

    const toNum = (v) => {
        if (v == null || v === "") return 0;
        // 쉼표/공백 제거
        const s = String(v).replace(/[, ]/g, "");
        // 안전 범위 벗어나는 BIGINT라면 차트에선 Number로 강제(소수점X)
        return Number.isFinite(Number(s)) ? Number(s) : parseFloat(s);
    };
    // 표시 중인 컬럼 목록(= 테이블에 보이는 필드 키) 구하기
    const getVisibleColumns = (data, columnMap) => {
        if (!data?.length) return [];
        return Object.keys(data[0]).filter(
            (col) => !HIDDEN_COLUMNS.includes(columnMap[col])
        );
    };

    // 합계 행 만들기: 숫자면 합계, 텍스트는 빈칸 (대표 텍스트 컬럼엔 "합계" 표시)
    const buildTotalsRow = (data, visibleCols) => {
        const totals = {};
        const labelCol =
            visibleCols.find(
                (col) =>
                    !SUM_EXCLUDED_COLUMNS.includes(col) && // 합계 제외 목록 건너뜀
                    data.some((r) => isNaN(toNum(r[col])))
            ) ?? visibleCols[0];

        visibleCols.forEach((col) => {
            if (SUM_EXCLUDED_COLUMNS.includes(col)) {
                // 계산 제외 컬럼은 그냥 빈칸
                totals[col] = "";
                return;
            }

            const sum = data.reduce((acc, row) => {
                const n = toNum(row[col]);
                return acc + (Number.isFinite(n) ? n : 0);
            }, 0);

            const allNumeric = data.every((row) =>
                Number.isFinite(toNum(row[col]))
            );
            totals[col] = allNumeric ? sum : "";
        });

        if (labelCol) totals[labelCol] = "합계";
        return totals;
    };

    /**
     * rows: API에서 받은 데이터 배열 (각 항목은 field 키를 가짐)
     * selectedColumns: 사용자 선택 "라벨(한글)" 배열
     * label: 차트 legend/제목에 표시할 문구
     * columnMap: [{ field, label | headerName | name }, ...]
     */
    const buildSumChartData = (rows, selectedColumns, label, columnMap) => {
        // 숫자 안전 파싱 (콤마/통화기호/공백 제거)
        const toNumber = (v) => {
            if (v == null) return 0;
            const n = Number(String(v).replace(/[^\d.-]/g, ""));
            return Number.isFinite(n) ? n : 0;
        };

        // 컬럼의 표시 라벨 추출 (프로젝트에 맞게 우선순위 조정)
        const getLabel = (col) =>
            col.label ?? col.headerName ?? col.name ?? col.field;

        // 라벨→필드 매핑 테이블
        const labelToField = new Map(
            Object.entries(columnMap).map(([field, label]) => [label, field])
        );

        // 선택 라벨과 같은 순서의 필드 배열 (없으면 라벨을 필드로 가정)
        const selectedFields = selectedColumns.map(
            (lbl) => labelToField.get(lbl) ?? lbl
        );

        // 합계 객체는 "라벨" 기준으로 보관 (UI 표시에 유리)
        const sums = Object.fromEntries(selectedColumns.map((lbl) => [lbl, 0]));

        // 합계 계산 (rows는 field로 접근)
        for (const row of rows || []) {
            selectedColumns.forEach((lbl, i) => {
                const field = selectedFields[i];
                if (!field) return; // 매핑 실패 시 스킵
                sums[lbl] += toNumber(row?.[field]);
            });
        }

        // 차트 데이터 생성 (라벨 순서 유지)
        return {
            labels: selectedColumns,
            datasets: [
                {
                    label,
                    data: selectedColumns.map((lbl) => sums[lbl]),
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                },
            ],
        };
    };

    const drawChat = () => {};
    const handleSearch = useCallback(async () => {
        setLoading({
            ...loading,
            chartLoading: true,
        });
        setFilteredData([]);
        setChartData(null);

        if (!selectedQuarter || !selectedGu?.value || !selectedDong?.value) {
            alert("기준 분기, 자치구, 행정동을 선택해주세요.");
            setLoading({
                ...loading,
                chartLoading: false,
            });
            return;
        }

        const params = {
            year_quarter: selectedQuarter, //기준날짜 코드(필)
            district_code: selectedGu?.value, //자치구 코드(필)
            town_code: selectedDong?.value, //행정동 코드(필)
            service_code: selectedServices?.map((s) => s.value) || "", //서비스업종
            hinterland_code: selectedRegions?.map((a) => a.value) || "", //상권배후지코드
        };

        // 객체 → 쿼리스트링 변환
        const queryString = new URLSearchParams(params).toString();

        console.log("queryString", queryString);

        await fetch(`http://localhost:5500/quarter-sale/list?${queryString}`)
            .then((r) => r.json())
            .then((json) => {
                console.log(json);
                if (json.status.code === 200) {
                    // 데이터 처리
                    const rows = json.data ?? [];

                    if (rows.length > 0) {
                        setRawData(rows); //검색 데이터
                        setFilteredData(rows);
                        // console.log("rows", rows);

                        // (A) 단일 합산 막대 차트
                        const chart = buildSumChartData(
                            rows,
                            selectedColumns, // 사용자가 체크한 컬럼들
                            `${selectedQuarter} / 선택된 조건`,
                            columnMap
                        );

                        console.log("chart", chart);

                        setChartData(chart);

                        // (B) 업종별 비교 차트가 필요하면 이걸로 교체
                        // const chart = buildByServiceChartData(rows, selectedColumns);
                        // setChartData(chart);
                    }
                    setIsSearched(true);
                }
            })
            .catch(console.error);

        setLoading({
            ...loading,
            chartLoading: false,
        });
    }, [
        selectedColumns,
        selectedGu,
        selectedDong,
        selectedServices,
        selectedRegions,
    ]);

    const handleDrawChat = useCallback(() => {
        setLoading({
            ...loading,
            chartLoading: true,
        });
        if (filteredData && filteredData.length > 0) {
            const chart = buildSumChartData(
                filteredData,
                selectedColumns, // 사용자가 체크한 컬럼들
                `${selectedQuarter} / 선택된 조건`,
                columnMap
            );

            console.log("chart", chart);

            setChartData(chart);
        }
        setLoading({
            ...loading,
            chartLoading: false,
        });
    }, [selectedColumns, filteredData]);

    useEffect(() => {
        if (isSearched) {
            setLoading({
                ...loading,
                chartLoading: false,
            });
        }
    }, [isSearched]);

    return (
        <Container maxWidth="false" sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                2025 서울시 상권 추정매출
            </Typography>

            {loading.cvsLoading && (
                <Box mt={3}>
                    <Typography variant="body1" color="textSecondary">
                        ⏳ CSV 파일을 불러오는 중입니다...
                    </Typography>
                    <CircularProgress size={24} sx={{ ml: 2 }} />
                </Box>
            )}
            {/* {rawData.length > 0 ? (
                <Box mb={3}>
                    <Button variant="outlined" onClick={resetDatas}>
                        📂 데이터 초기화
                    </Button>
                </Box>
            ) : (
                <Box mb={3}>
                    <Button variant="outlined" onClick={loadSampleFile}>
                        📂 서울시 상권 추정매출-상권배후지 데이터 불러오기
                    </Button>
                </Box>
            )} */}

            <Box
                sx={{
                    display: "flex",
                    gap: 3,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    mt: 2,
                }}
            >
                <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        기준 분기
                    </Typography>
                    <ReactSelect
                        options={quarterList.map((q) => ({
                            label: q,
                            value: q,
                        }))}
                        value={
                            selectedQuarter
                                ? {
                                      label: selectedQuarter,
                                      value: selectedQuarter,
                                  }
                                : null
                        }
                        onChange={(option) => {
                            if (option) {
                                handleQuarterChange({
                                    target: { value: option.value },
                                });
                            }
                        }}
                        placeholder="기준 분기 선택"
                        isSearchable
                    />
                </Box>

                {/* 자치구 */}
                <Box sx={{ minWidth: 240 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        자치구
                    </Typography>
                    <ReactSelect
                        options={guOptions}
                        value={selectedGu}
                        onChange={(option) => handleGuChange(option)}
                        placeholder="자치구 선택"
                        isClearable
                        isDisabled={!selectedQuarter}
                    />
                </Box>

                {/* 행정동 */}
                <Box sx={{ minWidth: 240 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        행정동
                    </Typography>
                    <ReactSelect
                        options={dongOptions}
                        value={selectedDong}
                        onChange={(option) => handleDongChange(option)}
                        placeholder="행정동 선택"
                        isClearable
                        isDisabled={!selectedGu}
                    />
                </Box>

                <Box sx={{ minWidth: 300 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        상권
                    </Typography>
                    <ReactSelect
                        isMulti
                        options={regionList}
                        value={selectedRegions}
                        onChange={(opts) => setSelectedRegions(opts)}
                        placeholder="상권 검색..."
                        isSearchable
                        isDisabled={!selectedDong}
                    />
                </Box>

                <Box sx={{ minWidth: 300 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        업종
                    </Typography>
                    <ReactSelect
                        isMulti
                        options={serviceList}
                        value={selectedServices}
                        onChange={(opts) => {
                            console.log("opts", opts),
                                setSelectedServices(opts);
                        }}
                        placeholder="업종 검색..."
                        isSearchable
                        isDisabled={!selectedDong}
                    />
                </Box>
                {selectedQuarter &&
                    selectedGu?.value &&
                    selectedDong?.value && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                검색
                            </Typography>
                            <ButtonGroup variant="outlined">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSearch}
                                    disabled={loading.chartLoading}
                                    startIcon={
                                        loading.chartLoading ? (
                                            <CircularProgress
                                                size={16}
                                                color="inherit"
                                            />
                                        ) : null
                                    }
                                >
                                    {loading.chartLoading
                                        ? "검색 중..."
                                        : "🔍 검색"}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleResetSearch}
                                    disabled={loading.chartLoading}
                                    startIcon={
                                        loading.chartLoading ? (
                                            <CircularProgress
                                                size={16}
                                                color="inherit"
                                            />
                                        ) : null
                                    }
                                >
                                    초기화
                                </Button>
                            </ButtonGroup>
                        </Box>
                    )}
            </Box>

            {columnList.length > 0 && (
                <Box mt={3}>
                    <Typography variant="subtitle1">비교할 열 선택:</Typography>
                    <Box
                        display="flex"
                        flexWrap="wrap"
                        gap={1.5}
                        sx={{
                            maxHeight: 150,
                            overflowY: "scroll",
                            mx: "auto",
                        }}
                    >
                        {columnList.map((col) => {
                            const isChecked = selectedColumns.includes(col);
                            return (
                                <CheckboxForm $checked={isChecked} key={col}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                const checked =
                                                    e.target.checked;
                                                const value = col;
                                                if (checked) {
                                                    setSelectedColumns([
                                                        ...selectedColumns,
                                                        value,
                                                    ]);
                                                } else {
                                                    setSelectedColumns(
                                                        selectedColumns.filter(
                                                            (c) => c !== value
                                                        )
                                                    );
                                                }
                                            }}
                                        />
                                        {col}
                                    </label>
                                </CheckboxForm>
                            );
                        })}
                    </Box>
                </Box>
            )}

            <p
                style={{
                    fontSize: 13,
                }}
            >
                {`[분기 : ${selectedQuarter} ,자치구 : ${
                    selectedGu ? selectedGu?.label : ""
                }, 행정동 : ${selectedDong ? selectedDong?.label : ""},`}{" "}
                {`${
                    selectedRegions?.length > 0
                        ? `상권 : ${selectedRegions?.map((i) => i.label)},`
                        : ""
                }`}{" "}
                {`${
                    selectedServices?.length > 0
                        ? `업종 : ${selectedServices?.map((i) => i.label)}`
                        : ""
                }`}
                {`]`}
            </p>

            {isSearched && filteredData?.length > 0 && (
                <>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <ButtonGroup variant="outlined" sx={{ mt: 3 }}>
                            <Button
                                variant={
                                    chartType === "bar"
                                        ? "contained"
                                        : "outlined"
                                }
                                onClick={() => setChartType("bar")}
                            >
                                막대형
                            </Button>
                            <Button
                                variant={
                                    chartType === "pie"
                                        ? "contained"
                                        : "outlined"
                                }
                                onClick={() => setChartType("pie")}
                            >
                                원형
                            </Button>
                        </ButtonGroup>
                        <span>
                            {`검색된 데이터 : ${filteredData?.length} 개 `}
                            <ButtonGroup variant="outlined" sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleDrawChat}
                                    disabled={loading.chartLoading}
                                    startIcon={
                                        loading.chartLoading ? (
                                            <CircularProgress
                                                size={16}
                                                color="inherit"
                                            />
                                        ) : null
                                    }
                                >
                                    {loading.chartLoading
                                        ? "그리는중 중..."
                                        : `${selectedColumns.length}개 비교 조건으로 차트 다시 그리기`}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setSelectedColumns([])}
                                    disabled={loading.chartLoading}
                                    startIcon={
                                        loading.chartLoading ? (
                                            <CircularProgress
                                                size={16}
                                                color="inherit"
                                            />
                                        ) : null
                                    }
                                >
                                    비교 조건 초기화
                                </Button>
                            </ButtonGroup>
                        </span>
                    </Box>

                    {chartData && selectedColumns.length > 0 && (
                        <Box mt={5}>
                            {chartType === "bar" && (
                                <Bar data={chartData} options={chartOptions} />
                            )}
                            {chartType === "pie" && (
                                <Box
                                    sx={{
                                        maxHeight: 400,
                                        maxWidth: 400,
                                        mx: "auto",
                                    }}
                                >
                                    <Pie
                                        data={{
                                            labels: chartData.labels,
                                            datasets: [
                                                {
                                                    data: chartData.datasets[0]
                                                        .data,
                                                    backgroundColor: [
                                                        "#FF6384",
                                                        "#36A2EB",
                                                        "#FFCE56",
                                                        "#4BC0C0",
                                                        "#9966FF",
                                                        "#FF9F40",
                                                    ],
                                                },
                                            ],
                                        }}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                tooltip: {
                                                    callbacks: {
                                                        label: (ctx) =>
                                                            `${
                                                                ctx.label
                                                            }: ${ctx.raw.toLocaleString()}`,
                                                    },
                                                },
                                                legend: { position: "bottom" },
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    )}
                </>
            )}

            {isSearched && filteredData.length > 0 && (
                <Box mt={5}>
                    <Typography variant="h6" gutterBottom>
                        📋 필터된 데이터 리스트
                    </Typography>
                    <TableContainer
                        component={Paper}
                        sx={{ maxHeight: 400, overflow: "auto" }}
                    >
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {Object.keys(filteredData[0])
                                        .filter(
                                            (col) =>
                                                !HIDDEN_COLUMNS.includes(
                                                    columnMap[col]
                                                )
                                        )
                                        .map((col) => {
                                            const iscolum =
                                                selectedColumns.includes(col);

                                            return (
                                                <TableCell
                                                    key={col}
                                                    sx={{
                                                        position: "sticky",
                                                        top: 0,
                                                        zIndex: 1,
                                                        backgroundColor: iscolum
                                                            ? "#d0f0fd"
                                                            : "#f5f5f5",
                                                        fontWeight: iscolum
                                                            ? "bold"
                                                            : "normal",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {columnMap[col] ?? col}
                                                    {/* {isText && (
                                                    <input type="checkbox" />
                                                )} */}
                                                </TableCell>
                                            );
                                        })}
                                </TableRow>
                            </TableHead>
                            {!loading.chartLoading && (
                                <TableBody>
                                    {filteredData.map((row, idx) => (
                                        <TableRow key={idx}>
                                            {Object.entries(row)
                                                .filter(
                                                    ([col]) =>
                                                        !HIDDEN_COLUMNS.includes(
                                                            columnMap[col]
                                                        )
                                                )
                                                .map(([col, cell], cidx) => {
                                                    const isText =
                                                        EXCLUDED_COLUMNS.includes(
                                                            columnMap[col]
                                                        );
                                                    const isNumber =
                                                        !isNaN(cell) &&
                                                        cell !== "" &&
                                                        cell !== null;
                                                    const value =
                                                        isNumber && !isText
                                                            ? Number(
                                                                  cell
                                                              ).toLocaleString()
                                                            : cell;

                                                    return (
                                                        <TableCell
                                                            key={cidx}
                                                            sx={{
                                                                backgroundColor:
                                                                    selectedColumns.includes(
                                                                        columnMap[
                                                                            col
                                                                        ]
                                                                    )
                                                                        ? "#e6f7ff"
                                                                        : "inherit",
                                                                fontWeight:
                                                                    selectedColumns.includes(
                                                                        columnMap[
                                                                            col
                                                                        ]
                                                                    )
                                                                        ? "bold"
                                                                        : "normal",
                                                                whiteSpace:
                                                                    "nowrap",
                                                                textAlign:
                                                                    isNumber &&
                                                                    !isText
                                                                        ? "right"
                                                                        : "center",
                                                            }}
                                                        >
                                                            {value}
                                                        </TableCell>
                                                    );
                                                })}
                                        </TableRow>
                                    ))}

                                    {(() => {
                                        const visibleCols = getVisibleColumns(
                                            filteredData,
                                            columnMap
                                        );
                                        const totalsRow = buildTotalsRow(
                                            filteredData,
                                            visibleCols
                                        );
                                        return (
                                            <TableRow>
                                                {visibleCols.map((col, i) => {
                                                    const cell = totalsRow[col];
                                                    const isNumberCell =
                                                        cell !== "" &&
                                                        Number.isFinite(
                                                            Number(cell)
                                                        );
                                                    return (
                                                        <TableCell
                                                            key={`sum-${i}`}
                                                            sx={{
                                                                position:
                                                                    "sticky",
                                                                bottom: 0,
                                                                zIndex: 1,
                                                                backgroundColor:
                                                                    "#fff9e6",
                                                                fontWeight:
                                                                    "bold",
                                                                whiteSpace:
                                                                    "nowrap",
                                                                textAlign:
                                                                    isNumberCell
                                                                        ? "right"
                                                                        : "center",
                                                                borderTop:
                                                                    "2px solid #ddd",
                                                            }}
                                                        >
                                                            {isNumberCell
                                                                ? Number(
                                                                      cell
                                                                  ).toLocaleString()
                                                                : cell}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })()}
                                </TableBody>
                            )}
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Container>
    );
}
