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

 
export const initRedis = async () => {
    await redis.connect()
}

/**
 * Redis를 이용한 Get Method Cache Middleware
 * @param {*} req express req
 * @param {*} res express res
 * @param {*} next 
 * @returns 
 */
export const getCacheData = async (req,res,next) => {

    let key = req.route.path.split(":")[0]

    // cache 사용은 GET method 만 대상
    if(req.method === 'GET'){
        Object.keys(req.params).forEach(item => {
            key += `:${req.params[item]}`
        })
        Object.keys(req.query).forEach(item => {
            key += `:${req.query[item]}`
        })
        let redisData = await redis.get(key)
        if(redisData){
            console.log(`Cache Hit: ${key}`)
            return res.json(JSON.parse(redisData))
        }else {
            console.log(`Cache Miss: ${key}`)
        }
    }
    
    return next()
}

/**
 * Redis에 데이터 저장 
 * cache 되지 않는 데이터를 저장하여 사용하기 위한 용도  
 * @param {*} req  key 값을 만들기 위한 req object
 * @param {*} data 캐시될 데이터
 * @param {*} expiredAt 캐시 만료 시간
 */
export const saveCacheData = async (req, data, expiredAt) => {

    let key = req.route.path.split(":")[0]
   
    Object.keys(req.params).forEach(item => {
        key += `:${req.params[item]}`
    })
    Object.keys(req.query).forEach(item => {
        key += `:${req.query[item]}`
    })

    await redis.setEx(key, expiredAt, JSON.stringify(data))
}