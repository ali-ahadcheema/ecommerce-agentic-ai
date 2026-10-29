import redis from "ioredis"

const pub = new redis({
    host: "127.0.0.1",
    port: 6379
})

await pub.publish("order events", JSON.stringify({
    orderid: "123",
    orderstatus: "paid"
}))

console.log("message send")

await pub.quit()