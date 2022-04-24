import express from "express";
import {checkSchema, oneOf, validationResult, query, body} from 'express-validator'
import moment from "moment";
import { getMarketData, updateMarketData }from "./investment/stock.js"
import "express-async-errors";

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
const logger = (req, res, next) => {
  console.log(`Time: ${Date.now()}: ${req.url}`)
  return next()
}

const app = express();
app.use(express.json());
app.use(logger)
app.use(errorChecker)


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
  errorChecker,
  async (req,res) => {
    let params = req.params

    await updateMarketData(params.exchangeCode, params.code, req.body)
    res.json("updated")
  }


)


const port = process.env.SERVER_PORT || 3001;
app.listen(port, () => {
  console.log(`Server on ${port} Port`);
});