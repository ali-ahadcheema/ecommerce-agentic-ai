import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()
const redis = new Redis(process.env.Redis_url)

redis.on("connect", () => {
    console.log("redis is conected")
})

redis.on("error", (err) => {
    console.log("redis not connected", err)
})

await redis.set("test", "hello");
const value = await redis.get("test");

console.log(value);

export default redis

