const fs = require('fs');
const http = require('http');
const querystring = require('querystring');

let pageViews = 0;
let metricsViews = 0;
let queue = [];

const homePage = fs.readFileSync('index.html');

function generate(items) {
    //todo generate items
    console.log(`Generating ${items} items`);
    for (let i = 0; i < items; i++) {
        queue.push({hello: 'world'});
    }
}

http.createServer((request, response) => {
    console.log(request.url);

    if (request.url === '/metrics') {

        metricsViews++;

        let lines = [];
        lines.push('# TYPE demo_focus.requests_total counter');
        lines.push(`demo_focus.requests_total{path="/"} ${pageViews}`);
        lines.push(`demo_focus.requests_total{path="/metrics"} ${metricsViews}`);
        lines.push('# TYPE demo_focus.queue_size gauge');
        lines.push(`demo_focus.queue_size ${queue.length}`);
        lines.push('');
        response.end(lines.join("\n"));

    } else if (request.url === '/generate') {

        let body = [];
        request.on('error', (err) => {
            console.error(err);
        }).on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            let params = querystring.parse(Buffer.concat(body).toString());
            generate(parseInt(params['items']));
            response.writeHead(302, {Location: '/'});
            response.end();
        });

    } else if (request.url === '/next') {

        let item = queue.length > 0 ? [queue.pop()] : [];
        response.end(JSON.stringify(item) + "\n");

    } else {

        pageViews++;

        response.setHeader('Content-Type', 'text/html');
        response.end(eval('`' + homePage + '`'));

    }
}).listen(10080);
