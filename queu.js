import { Queue } from "bullmq";
import redis from "./redis.js";

const queu = new Queue("email queu", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});
export default queu