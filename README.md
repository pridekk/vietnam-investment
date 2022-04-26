## 투자 정보 API 개발 :grinning: :+1:

## 서비스 구조
<img src="./architecture.png"/>

## MONGO DB 
<p>
주식 정보를 제공하기 위한 NoSQL DB
</p>
Mongo-Express: 웹을 통한 Mongo DB 설정 및 데이터 확인 <br/>
접속: http://localhost:8089 (root/example)

<br>

### Document 구조 
종목별로 mongodb에 document 형식으로 저장 
Document 구조는 자유롭게 수정 가능 <br>

중복 방지를 위해 unique 인덱스 적용 필요<br>
Document 내부 array 구조에 대한 unique 인덱스 설정은 불가- 해당 중복 방지는 application logic에서 처리 필요<br>

collection: stocks 내부에 종목별로 아래와 같은 구조로 기본 저장

<p>

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

## Load Balancer

캐시 및 백엔드 서버 동적 부하분산을 위해 최신 버전의 Haproxy image 적용

벡엔드 수량 변경에 대해 동적으로 부하분산 처리를 위해 dns, server-template 설정 

```bash
resolvers docker
  nameserver dns1 127.0.0.11:53

backend investment_server
  mode http
  balance roundrobin
  option httpchk HEAD /
  http-check expect status 200
  http-request cache-use api_cache
  http-response cache-store api_cache
  http-response set-header X-Cache-Status HIT if !{ srv_id -m found }
  http-response set-header X-Cache-Status MISS if { srv_id -m found }
  server-template investment- 4 investment:3001 check resolvers docker init-addr none
```

* 서비스 
    * 포트: 80
    * node 서버 라운드로빈 부하분산 및 http get cache 처리 
    * 아래 부분 수정을 통해 최대 caching 시간, 사이즈 등을 조절 가능 
    * Cache 제약 사항
        * Header에 authorization이 포함될 경우 cache 되지 않음
        * http 1.1 이하 cache 하지 않음
        * GET 만 cache
        * 위에 해당하는 내용의 Cache를 위해서는 Backend에서 Cache 처리 작업 필요 

``` bash
cache api_cache
  total-max-size 4095 # 4095 Megabytes
  max-object-size 2000000 # 2 Megabytes
  max-age 600 # seconds 
```

    
* 메니지 먼트
    * 포트: 8888
    * 용도: 간단한 서비스 stat 정보 제공 
    * 접속: http://127.0.0.1:8888/admin?stats (haproxyadmin:changeme, haproxy.cfg에서 변경 가능)

## Server

<p>

투자 정보 제공하는 서비스 로직을 NodeJS Express를 통해 구현 <br>
import, async, await 구문을 사용하여 최신 노드 버전 (18)에서 테스트 되었음 <br>

서버 대수는 docker-compose 파일의 replicas 수량 조절하여 처리 가능 
```bash
investment:
    image: node:18-alpine
    working_dir: /usr/src/app
    volumes:
      - ./server:/usr/src/app
    entrypoint: [ "npm", "start" ]
    environment:
      MONGODB_URL: mongodb://root:example@mongo:27017/
      REDIS_URL: "redis://redis:6379"
    # ports: # replica 모드에서는 주석처리해야함
    #   - "8082:3001"
    deploy:
      mode: replicated
      replicas: 2 
```