# moduData

서울시 상권분석 데이터(우리마을가게 상권분석서비스) 조회 서비스. Express + Sequelize(MySQL) 백엔드와 Next.js 프론트엔드로 구성.(미완성)

## 프로젝트 구조

```
moduData/
├─ back/                 # Express API 서버
│  ├─ app.js             # 서버 엔트리 (PORT 5500)
│  ├─ config/config.js   # Sequelize DB 접속 설정 (.env 참조)
│  ├─ models/            # Sequelize 모델 (RegionCode, QuarterSales)
│  ├─ routers/           # local.js, quarter.js 라우터
│  ├─ colmap.json        # CSV 원본 컬럼명 ↔ DB 컬럼명 매핑
│  ├─ csv-to-db.js       # CSV → MySQL 적재 스크립트 (CommonJS)
│  ├─ csv-to-db2.js      # CSV → MySQL 적재 스크립트 (ESM, 배치 적재/타입 추론)
│  └─ shp-dbfto-csv.js   # shp/dbf(상권배후지 공간자료) → CSV 변환 스크립트
└─ front/                # Next.js 13 프론트엔드
   └─ src/
      ├─ pages/          # index.js, market.js, CsvViewer.js, system/index.js
      ├─ components/     # Main.js, Loading.js 등
      ├─ reducers/, sagas/, store/  # redux + redux-saga
      ├─ func/           # colList.js, common.js, datas.js, system.js (유틸)
      └─ config/config.js # 환경변수 기반 API URL 상수
```

## 데이터 흐름 (배경)

서울 열린데이터광장 "우리마을가게 상권분석서비스" CSV(분기별 매출)와 상권배후지 shp/dbf 공간자료를 받아 아래 순서로 DB에 적재.

1. `back/shp-dbfto-csv.js` : shp/dbf(상권배후지 코드/자치구/행정동 매핑) → `back/data/output.csv`
2. 위 CSV를 `region_code` 테이블로 적재 (RegionCode 모델과 매칭)
3. `back/csv-to-db.js` 또는 `csv-to-db2.js` : 분기별 매출 CSV(`back/data/seoul-YYYYQ.csv`) → `seoul-dataview` 테이블(QuarterSales 모델) 적재
   - `csv-to-db2.js`가 더 최신 버전(배치 인서트, 컬럼 타입 자동 추론, 인코딩 자동 판별 포함)
   - 스크립트 상단 `CSV_PATH`, `DROP_TABLE_FIRST` 값 확인 후 실행 (최초 적재 시 `true`, 이후 누적 적재 시 `false`로 변경)
4. `back/colmap.json`은 원본 한글 컬럼명과 DB 컬럼명 매핑 참고용 (모델 파일의 `field` 값과 동일한 소스)

DB 컬럼명은 원본 CSV 헤더(한글) 그대로이고, Sequelize 모델에서 영문 `attr`로 매핑해서 사용. 새 컬럼 추가/변경 시 `back/models/QuarterSales.js`, `RegionCode.js`의 `field` 값과 실제 DB 컬럼명이 일치하는지 확인 필요.

## 백엔드 (back)

### 요구사항
- Node.js, MySQL 실행 중이어야 함
- DB: `seoul` (config.js 기본값), 테이블: `region_code`, `seoul-dataview`

### 환경변수 예시 (`back/.env`)
```
DB_USERNAME=root
DB_PASSWORD=1234
DB_HOST=127.0.0.1
DB_DATABASE=seoul
```
(운영 환경 반영 시 위 값 교체. `DB_DIALECT`, `DB_TIMEZONE`은 옵션, 미설정 시 기본값 mysql / +09:00)

### 실행
```
cd back
npm install
npm start        # nodemon app.js, PORT 5500
```

CORS는 `http://localhost:8080`, `http://172.30.40.34:8080`만 허용 (app.js:30). 프론트 배포지 바뀌면 여기 추가 필요.

### API

**`/local`**
- `GET /local/gu` : 자치구 목록 (district_code, district_name)
- `GET /local/dong?gu={district_code}` : 자치구 선택 시 행정동 목록 (town_code, town_name)
- `GET /local/service_code?town_code={}&s={year_quarter}` : 행정동 + 분기 기준 상권배후지/서비스업종 목록

**`/quarter-sale`**
- `GET /quarter-sale/columns` : QuarterSales 모델 속성명 ↔ 실제 DB 컬럼명 목록
- `GET /quarter-sale/list?district_code={}&town_code={}&year_quarter={}&service_code={}&hinterland_code={}`
  - district_code, town_code, year_quarter 필수
  - service_code, hinterland_code는 콤마구분 다중값 가능 (`CS100001,CS300021`)
  - 매출 상세 데이터(QuarterSales row) 반환

## 프론트엔드 (front)

Next.js 13 (pages router) + Redux/Redux-Saga + MUI + Chart.js.

### 환경변수 (`.env.local` 필요, 저장소에 없음 — 신규 생성)
```
NEXT_PUBLIC_SSR_API_URL=http://localhost:5500
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_DOMAIN=
```
(`front/src/config/config.js`에서 참조. 백엔드 주소가 바뀌면 `NEXT_PUBLIC_SSR_API_URL` 수정)

### 실행
```
cd front
npm install
npm run dev      # next -p 8080
npm run build
npm start         # next start -p 80 (프로덕션)
```

### 주요 페이지
- `pages/index.js` : 메인 (자치구/행정동/업종 선택 → 상권분석 조회, 1000줄+ 핵심 화면)
- `pages/market.js` : 상권 데이터 시각화/조회 화면
- `pages/CsvViewer.js` : CSV 데이터 뷰어
- `pages/system/index.js` : 시스템/설정 페이지

## 인수인계 시 확인할 것
- `back/.env`, `front/.env.local`은 git에 커밋 안 됨 → 신규 서버 세팅 시 직접 생성 필요
- MySQL에 `region_code`, `seoul-dataview` 테이블 데이터 없으면 API가 빈 배열만 반환 → 위 "데이터 흐름" 순서대로 CSV 적재 먼저 수행
- 분기 데이터(`year_quarter`) 추가되면 `back/data/`에 새 CSV 넣고 `csv-to-db2.js`로 적재 (이때 `DROP_TABLE_FIRST=false` 확인)
- CORS 허용 origin 목록(app.js) 배포 도메인 기준으로 갱신 필요
