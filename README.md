## 투자 정보 API 개발

<p>
종목별로 mongodb에 document 형식으로 저장 
Document 구조는 자유롭게 수정 가능 

Document 구조

* exchange_code: 거래소 코드
* code: 종목 코드
* summary: 기업 개요
* makret_data: 일별 시세 데이터
    * date: 일자
    * open: 시가
    * close: 종가
    * high: 고가
    * low: 저가 
* finance: 기업 재무 정보 
    * year: 회계년도
    * month: 월
    * assets: 자산
    * liabilities: 부채
    * equity: 자본
    * sales: 매출
    * profit: 영업이익
</p>
