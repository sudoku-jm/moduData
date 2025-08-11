// const QUARTERS = ["20241", "20242", "20243", "20244", "20251"];
export const QUARTERS = ["20251"];

export const chartOptions = {
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
            //범례
            display: true,
            position: "top", // 'top'|'left'|'bottom'|'right'
            align: "center", // 'start'|'center'|'end'
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
