//siteType 체크
export const urlQuery = {
    getQuery: (query) => {
        //pageProps.query가 있으면 실행.

        if (query.site_type) {
            //어디에서 해당 페이지 접근했는지 site_type 파라미터로 확인.
            //사이트타입이 있으면 로컬스토리지 SITE_TYPE 저장
            urlQuery.getSiteTypeQuery(query);
        }
    },
    getSiteTypeQuery: (query) => {
        const SITE_TYPE = query.site_type;
        SessionStorage.setSessionStorage("SITE_TYPE", SITE_TYPE);
    },
};
