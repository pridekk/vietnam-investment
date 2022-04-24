import express from "express";
import {checkSchema, oneOf, validationResult, query, body} from 'express-validator'
import moment from "moment";
import { getMarketData }from "./investment/stock.js"


const errorChecker = ( req, res, next) => {
  const errors = validationResult(req)

  console.log(errors)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }
  next()
}

const logger = (req, res, next) => {
  console.log(`Time: ${Date.now()}: ${req.url}`)
  next()
}
const app = express();

app.use(logger)

// 종목 일별 가격 제공
app.get("/investment/stocks/:exchangeCode/:code",
  [
    query('startedAt').optional().isDate(),
    query('endAt').optional().isDate()
  ],
  errorChecker,
  async (req, res) => {

    let params = req.params
    let startedAt = req.query.startedAt || moment().subtract(30, 'days').format(("YYYY-MM-DD"))
    let endAt = req.query.endAt || moment().format(("YYYY-MM-DD"))
    let marketData = await getMarketData(params.exchangeCode, params.code, startedAt, endAt)
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
  async (req,res) => {

    res.send('ok')
  }


)


const port = process.env.SERVER_PORT || 3001;
app.listen(port, () => {
  console.log(`Server on ${port} Port`);
});