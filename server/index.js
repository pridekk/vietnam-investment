import express from "express";
import { validationResult, query, body} from 'express-validator'
import moment from "moment";
import { getMarketData, updateMarketData }from "./investment/stock.js"
import "express-async-errors";
import { createClient } from "redis";

/**
 * 데이터 캐시용 Redis
 * HaProxy에서 캐시하지 못하는 데이터에 대해서 Cache 추가 적용
 *
 * 예: Post 응답, Authorization Header 가 존재, Http 1.1 이하
 */
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"
const redis = createClient( {
  url: REDIS_URL
})

/**
 * Validation Error 확인 middleware
 */
const errorChecker = ( req, res, next) => {
  const errors = validationResult(req)

  console.log(errors)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }
  return next()
}

/**
 * Logging Middleware
 */
const logger = (req, res, next) => {
  console.log(`Time: ${Date.now()}: ${req.url}`)
  return next()
}

const app = express()
app.use(express.json())
app.use(logger)
app.use(errorChecker)


// 종목 일별 가격 제공
// 레디스에서 데이터 조회 후 없을 경우 mongo db에서 데이터 수신
// mongo 데이터일 경우 redis에 100초 cache 적용
app.get("/investment/stocks/:exchangeCode/:code",
  [
    query('startedAt').optional().isDate(),
    query('endAt').optional().isDate()
  ],
  errorChecker,
  async (req, res) => {
    let marketData = undefined

    let params = req.params
    let startedAt = req.query.startedAt || moment().subtract(30, 'days').format(("YYYY-MM-DD"))
    let endAt = req.query.endAt || moment().format(("YYYY-MM-DD"))

    let key = `${params.exchangeCode}:${params.code}:${startedAt}${endAt}`
    let redisData = await redis.get(key)
    console.log(redisData)
    if(redisData){
      marketData = JSON.parse(redisData)
    } else {
      marketData = await getMarketData(params.exchangeCode, params.code, startedAt, endAt)

      // await redis.hSet(key, "data", )
      await redis.setEx(key, 100, JSON.stringify(marketData))

    }

    res.json(marketData)
  }
);

// 종목 일별 가격데이터 업데이트
app.post("/investment/stocks/:exchangeCode/:code",
  [
    body().isArray(),
    body('*.date').isDate(),
    body('*.open').isNumeric(),
    body('*.close').isNumeric(),
    body('*.high').isNumeric(),
    body('*.low').isNumeric(),
  ],
  errorChecker,
  async (req,res) => {
    let params = req.params

    await updateMarketData(params.exchangeCode, params.code, req.body)
    res.json("updated")
  }
)


const port = process.env.SERVER_PORT || 3001;
app.listen(port, async () => {
  await redis.connect()
  console.log(`Server on ${port} Port`);
});