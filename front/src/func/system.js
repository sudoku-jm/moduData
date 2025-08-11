export const systemSetting = {
    timeSet: function () {
        // 시작일과 시작 시간
        // 시작일과 시작 시간(표준시간으로)
        // 예) 2024년 4월 6일 21시 : 2024, 11, 6, 9, 15, 0
        // new Date(Date.UTC(2024, 11 - 1, 6, 9, 15, 0))
        // 월의 숫자는 1작음

        // 시작일과 시작 시간(한국 시간으로)
        const startDate = new Date(Date.UTC(2024, 12 - 1, 5, 19, 30, 0));
        // const startDate = new Date(Date.UTC(2024, 11 - 1, 26, 9, 40, 0));
        // 종료일과 종료 시간(한국 시간으로)
        const endDate = new Date(Date.UTC(2024, 12 - 1, 6, 2, 0, 0));
        // const endDate = new Date(Date.UTC(2024, 11 - 1, 26, 9, 41, 0));

        // 현재 시간(한국 시간으로)
        const currentDate = new Date(new Date().getTime() + 9 * 60 * 60 * 1000); // 9시간을 밀리초로 변환하여 추가

        // 현재 시간이 시작 시간보다 이후이고 종료 시간보다 이전이면 계산이 진행됨
        const result = currentDate >= startDate && currentDate <= endDate;

        return result;
    },
};
