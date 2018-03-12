const request = require('request');
var fs = require('fs');

const API_URL = process.env.API_URL || "http://www.mocky.io/v2/5aa14ba23200000635e9ffed";
const TASK_TIME = process.env.TASK_TIME || 3000

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    while (true) {
        if (fs.existsSync('/stop_worker')) {
            return;
        }
        
        request(API_URL, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }       
            console.log(body);
        });
        await sleep(TASK_TIME);
    }
}


run();
