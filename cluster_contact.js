var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;
var workers = {};
var requests = 0;

if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        workers[i] = cluster.fork();
        (function (i) {
            workers[i].on('message', function(message) {
                if (message.cmd == 'incrementRequestTotal') {
                    requests++;
                    for (var j = 0; j < numCPUs; j++) {
                        workers[j].send({
                            cmd: 'updateOfRequestTotal',
                            requests: requests
                        });
                    }
                }
            });
        })(i);
    }
    cluster.on('death', function(worker) {
        console.log('Worker ' + worker.pid + ' died.');
    });
} else {
    process.on('message', function(message) {
        if (message.cmd == 'updateOfRequestTotal') {
            requests = message.requests;
        }
    });
    http.Server(function(req, res) {
        res.writeHead(200);
        res.end('Worker ID ' + cluster.worker.id
            + ' says cluster has responded to ' + requests
            + ' requests.');
        process.send({cmd: 'incrementRequestTotal'});
    }).listen(8000);
}
