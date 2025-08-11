import React, { useState } from "react";
import Papa from "papaparse";
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

const chartOptions = {
    responsive: true,
    plugins: {
        tooltip: {
            callbacks: {
                label: (context) => `값: ${context.raw.toLocaleString()}`,
            },
        },
        title: {
            display: true,
            text: `선택된 조건들의 열 비교`,
        },
        legend: {
            display: false,
        },
    },
    scales: {
        y: {
            ticks: {
                callback: (value) => value.toLocaleString(),
            },
        },
    },
};

const CsvRegionChart = () => {
    const [rawData, setRawData] = useState([]);
    const [quarterList, setQuarterList] = useState([]);
    const [selectedQuarter, setSelectedQuarter] = useState("");
    const [regionList, setRegionList] = useState([]);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [serviceList, setServiceList] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [columnList, setColumnList] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState({
        cvsLoading: false,
        chartLoading: false,
    });
    const [chartType, setChartType] = useState("bar");
    const [isSearched, setIsSearched] = useState(false);

    const EXCLUDED_COLUMNS = [
        "기준_년분기_코드",
        "상권_구분_코드",
        "상권_구분_코드_명",
        "상권배후지_코드",
        "상권배후지_코드_명",
        "서비스_업종_코드",
        "서비스_업종_코드_명",
    ];

    const HIDDEN_COLUMNS = [
        "상권_구분_코드",
        "상권_구분_코드_명",
        "상권배후지_코드",
        "상권배후지_코드_명",
        "서비스_업종_코드",
    ];

    const loadSampleFile = () => {
        setLoading({
            ...loading,
            cvsLoading: true,
        });
        fetch("/file/utf8-서울시 상권분석서비스(추정매출-상권배후지).csv")
            .then((res) => res.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        const data = results.data;
                        setRawData(data);
                        extractInitialLists(data);
                        setLoading({
                            ...loading,
                            cvsLoading: false,
                        });
                    },
                });
            })
            .catch((e) => {
                console.error("샘플 로드 실패", e);
                setLoading({
                    ...loading,
                    cvsLoading: false,
                });
            });
    };

    const extractInitialLists = (data) => {
        const quarters = Array.from(
            new Set(data.map((row) => row["기준_년분기_코드"]))
        ).filter(Boolean);
        setQuarterList(quarters);

        const columns = Object.keys(data[0] || {}).filter(
            (col) => !EXCLUDED_COLUMNS.includes(col)
        );
        setColumnList(columns);
    };

    const handleQuarterChange = (e) => {
        const value = e.target.value;
        setSelectedQuarter(value);

        const filtered = rawData.filter(
            (row) => row["기준_년분기_코드"] === value
        );

        const regions = Array.from(
            new Set(filtered.map((row) => row["상권배후지_코드_명"]))
        ).filter(Boolean);
        setRegionList(regions);
        setSelectedRegions([]);

        const services = Array.from(
            new Set(filtered.map((row) => row["서비스_업종_코드_명"]))
        ).filter(Boolean);
        setServiceList(services);
        setSelectedServices([]);

        setChartData(null);
        setSelectedColumns([]);
        setIsSearched(false);
    };

    const handleSearch = () => {
        setLoading({
            ...loading,
            chartLoading: true,
        });
        const filtered = rawData.filter((row) => {
            const matchQuarter = row["기준_년분기_코드"] === selectedQuarter;
            const matchRegion =
                selectedRegions.length === 0 ||
                selectedRegions.includes(row["상권배후지_코드_명"]);
            const matchService =
                selectedServices.length === 0 ||
                selectedServices.includes(row["서비스_업종_코드_명"]);
            return matchQuarter && matchRegion && matchService;
        });

        const sums = {};
        selectedColumns.forEach((col) => (sums[col] = 0));
        filtered.forEach((row) => {
            selectedColumns.forEach((col) => {
                const amount = parseInt(row[col]) || 0;
                sums[col] += amount;
            });
        });

        const labels = selectedColumns;
        const values = selectedColumns.map((col) => sums[col]);

        setChartData({
            labels,
            datasets: [
                {
                    label: `${selectedQuarter} / 선택된 조건`,
                    data: values,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                },
            ],
        });
        setFilteredData(filtered);
        setIsSearched(true);
    };

    useEffect(() => {
        if (isSearched) {
            setLoading({
                ...loading,
                chartLoading: false,
            });
        }
    }, [isSearched]);

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                CSV 데이터 다단계 필터링 차트
            </Typography>

            {loading.cvsLoading && (
                <Box mt={3}>
                    <Typography variant="body1" color="textSecondary">
                        ⏳ CSV 파일을 불러오는 중입니다...
                    </Typography>
                    <CircularProgress size={24} sx={{ ml: 2 }} />
                </Box>
            )}
            {rawData.length > 0 || (
                <Box mb={3}>
                    <Button
                        variant="outlined"
                        onClick={loadSampleFile}
                        sx={{ ml: 2 }}
                    >
                        📂 서울시 상권 추정매출-상권배후지 데이터 불러오기
                    </Button>
                </Box>
            )}

            {quarterList.length > 0 && (
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
                                    setSelectedQuarter(option.value);
                                    handleQuarterChange({
                                        target: { value: option.value },
                                    });
                                }
                            }}
                            placeholder="기준 분기 선택"
                            isSearchable
                        />
                    </Box>

                    <Box sx={{ minWidth: 300 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            상권배후지
                        </Typography>
                        <ReactSelect
                            isMulti
                            options={regionList.map((name) => ({
                                label: name,
                                value: name,
                            }))}
                            value={selectedRegions.map((r) => ({
                                label: r,
                                value: r,
                            }))}
                            onChange={(selectedOptions) =>
                                setSelectedRegions(
                                    selectedOptions.map((opt) => opt.value)
                                )
                            }
                            placeholder="상권배후지 검색..."
                            isSearchable
                        />
                    </Box>

                    <Box sx={{ minWidth: 300 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            서비스 업종
                        </Typography>
                        <ReactSelect
                            isMulti
                            options={serviceList.map((name) => ({
                                label: name,
                                value: name,
                            }))}
                            value={selectedServices.map((s) => ({
                                label: s,
                                value: s,
                            }))}
                            onChange={(selectedOptions) =>
                                setSelectedServices(
                                    selectedOptions.map((opt) => opt.value)
                                )
                            }
                            placeholder="서비스 업종 검색..."
                            isSearchable
                        />
                    </Box>
                </Box>
            )}

            {columnList.length > 0 &&
                (selectedRegions.length > 0 || selectedServices.length > 0) && (
                    <Box mt={3}>
                        <Typography variant="subtitle1">
                            비교할 열 선택:
                        </Typography>
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
                                    <CheckboxForm $checked={isChecked}>
                                        <label key={col}>
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
                                                                (c) =>
                                                                    c !== value
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

            {selectedColumns.length > 0 && (
                <Box mt={3}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSearch}
                        disabled={loading.chartLoading}
                        startIcon={
                            loading.chartLoading ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : null
                        }
                    >
                        {loading.chartLoading ? "검색 중..." : "🔍 검색"}
                    </Button>
                </Box>
            )}

            {!loading.chartLoading && isSearched && chartData && (
                <>
                    <ButtonGroup variant="outlined" sx={{ mt: 3 }}>
                        <Button
                            variant={
                                chartType === "bar" ? "contained" : "outlined"
                            }
                            onClick={() => setChartType("bar")}
                        >
                            막대형
                        </Button>
                        <Button
                            variant={
                                chartType === "pie" ? "contained" : "outlined"
                            }
                            onClick={() => setChartType("pie")}
                        >
                            원형
                        </Button>
                    </ButtonGroup>

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
                                                !HIDDEN_COLUMNS.includes(col)
                                        )
                                        .map((col) => {
                                            const iscolum =
                                                selectedColumns.includes(col);
                                            // const isText =
                                            //     EXCLUDED_COLUMNS.includes(col);

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
                                                    {col}
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
                                                    (col) =>
                                                        !HIDDEN_COLUMNS.includes(
                                                            col[0]
                                                        )
                                                )
                                                .map(([col, cell], cidx) => {
                                                    const isText =
                                                        EXCLUDED_COLUMNS.includes(
                                                            col
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
                                                                        col
                                                                    )
                                                                        ? "#e6f7ff"
                                                                        : "inherit",
                                                                fontWeight:
                                                                    selectedColumns.includes(
                                                                        col
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
                                </TableBody>
                            )}
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Container>
    );
};

export default CsvRegionChart;
