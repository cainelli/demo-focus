const fs = require('fs');
const http = require('http');
const querystring = require('querystring');
const request = require('request');

let pageViews = 0;
let metricsViews = 0;
let queue = [];
let workers = '';
let pods = {ready: 0, total: 0};
let token_file = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const KUBERNETES_API = 'https://api.sandbox1.gygkube.com:443';
const homePage = fs.readFileSync('index.html');



function generate(items) {
    //todo generate items
    console.log(`Generating ${items} items`);
    for (let i = 0; i < items; i++) {
        queue.push({hello: 'world'});
    }
}

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        let info = JSON.parse(body);
        
        pods = {ready: 0, total: 0};
        workers = info.items.map((pod,idx) => {
            pods.ready += pod.status.phase === 'Running' ? 1 : 0;
            pods.total += 1;

            return(`<div class=${pod.status.phase === 'Running' ? 'worker-ready' : 'worker-pending'}>P${idx}</div>`);
      })
    } else {
        console.log(error);
    }
  }
  

function getPods(namespace='default', labelSelector={'app':'demo-worker'}, limit=500) {
    
    fs.readFile(token_file, 'utf8', (err, access_token) => {
        if (err) {
            throw new Error(`An error occurred reading token file ${token_file}: ${err}`);
        }

        const options = {
            url: `${KUBERNETES_API}/api/v1/namespaces/${namespace}/pods?labelSelector=${querystring.stringify(labelSelector)}&limit=${limit}`,
            headers: {
                'Accept': 'application/json',
                'Authorization': "Bearer " + access_token.trim(),
                'Content-Type': 'application/json'
            },
            rejectUnauthorized: false,
        }

        request(options, callback);
    });
}

http.createServer((request, response) => {
    console.log(`${new Date().toString()} ${request.url}`);

    if (request.url === '/metrics') {

        metricsViews++;

        let lines = [];
        lines.push('# TYPE demo_focus_requests_total counter');
        lines.push(`demo_focus_requests_total{path="/"} ${pageViews}`);
        lines.push(`demo_focus_requests_total{path="/metrics"} ${metricsViews}`);
        lines.push('# TYPE demo_focus_queue_size gauge');
        lines.push(`demo_focus_queue_size ${queue.length}`);
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
        getPods();
        response.setHeader('Content-Type', 'text/html');
        response.end(eval('`' + homePage + '`'));

    }
}).listen(10080);
