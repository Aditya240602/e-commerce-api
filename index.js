import cluster from 'node:cluster';
import os from 'node:os';
import app from './app.js';
import connectDB from './utils/connectDatabase.js';

const PORT = process.env.PORT || 3000;

// This app was running as a single Node process, which means it could only
// ever use ONE CPU core no matter how much traffic hit it or how many
// autocannon connections were opened — that's why throughput plateaued
// around ~5,000 req/sec regardless of connection count in load tests.
//
// cluster forks one worker process per CPU core. Node's cluster module
// load-balances incoming connections across them (round-robin on most
// platforms), so the app can actually use all available cores instead
// of leaving them idle.
if (cluster.isPrimary) {
    const numWorkers = os.cpus().length;
    console.log(`Primary ${process.pid} starting ${numWorkers} worker(s)...`);

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    // If a worker crashes, replace it instead of silently running with
    // fewer workers than intended.
    cluster.on('exit', (worker, code, signal) => {
        console.error(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
        cluster.fork();
    });
} else {
    // Each worker is its own process, so each needs its own DB connection.
    await connectDB();
    app.listen(PORT, () => console.log(`Worker ${process.pid} listening on ${PORT}`));
}