import { Worker } from "worker_threads";

const worker = new Worker("./test.js");


worker.on("message", (result) => {
    console.log(`am second thread ${result}`)
})

console.log("am main thread and free")