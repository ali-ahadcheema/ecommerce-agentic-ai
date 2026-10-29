import redis from "ioredis"

const subscriber = new redis({
    host: "127.0.0.1",
    port: 6379
})

await subscriber.subscribe("order events")

subscriber.on("message", (channel, message) => {
    console.log("channel", channel)
    console.log(JSON.parse(message))
})
