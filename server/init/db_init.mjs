import { MongoClient } from "mongodb";
import docs from './stock_data.json' assert { type: "json"}

const uri =
  "mongodb://root:example@localhost:27018"

const client = new MongoClient(uri)

// Mongo db init
async function init() {
  try {
    await client.connect()
    const database = client.db('investment')
    const stocks = database.collection('stocks')
    const options = { ordered: true }

    const result = await stocks.insertMany(docs, options)

    console.log(`${result.insertedCount} documents were inserted`);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
  }
}

// 종목 데이터 추가 예제
async function update() {
  try {
    await client.connect()
    const database = client.db('investment')
    const stocks = database.collection('stocks')

    const filter = { "code": "005930", "exchange_code": "KRX" }

    const addMarketData = {
      $push: {
        'market_data': {"date": "2022-04-23","open":67200,"high":67800,"low":66600,"close":67000}
      }
    }
    const result = await stocks.updateOne(filter, addMarketData, {upsert:true})
    console.log(
      `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
    )

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
  }
}

// 종목 데이터 가져오기
async function find(exchange_code, code, startedAt, endAt) {
  try {
    await client.connect()
    const database = client.db('investment')
    const stocks = database.collection('stocks')

    const query = { "code": code, "exchange_code": exchange_code}

    const stock = await stocks.findOne(query, {projection: {_id: 1, code: 1, exchange_code: 1 ,
        market_data: {$filter: { input: '$market_data', as: 'market', cond: {$gte: ['$$market.date', '2022-04-20']}}} }})

    console.log(stock)

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
  }
}

// 종목 데이터 가져오기
async function createIndex() {
  try {
    await client.connect()
    const database = client.db('investment')
    const stocks = database.collection('stocks')

    await stocks.createIndex( { "exchange_code":1, "code": 1, "market_data.date": -1}, {unique: true})

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close()
  }
}

init().catch(console.dir)
// createIndex().catch(console.dir)
// update().catch(console.dir)
// find('KRX', '005930').catch(console.dir)
