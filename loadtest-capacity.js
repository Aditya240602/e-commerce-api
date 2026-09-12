import autocannon from 'autocannon';

// Steps to test — tweak these as needed
const STEPS = [100, 200, 300, 500, 700, 900, 1100, 1300, 1500];

const DURATION_PER_STEP = 10; // seconds — keep short since we're running many steps
const URL = 'http://localhost:3000';

const REQUESTS = [
    { path: '/products?page=1' },
    { path: '/products?page=2' },
    { path: '/products?page=3' },
    { path: '/products?page=1&limit=5' },
    { path: '/products?page=4' } // likely a cache miss if you only seeded a few pages
];

function runStep(connections) {
    return new Promise((resolve, reject) => {
        console.log(`\n=== Testing with ${connections} connections ===`);

        const instance = autocannon({
            url: URL,
            connections,
            duration: DURATION_PER_STEP,
            requests: REQUESTS
        }, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });

        // live progress bar in terminal
        autocannon.track(instance, { renderProgressBar: true });
    });
}

async function main() {
    const summary = [];

    for (const connections of STEPS) {
        try {
            const result = await runStep(connections);

            const errorRate = result.errors / (result.requests.total || 1);
            const timeoutCount = result.timeouts;
            const non2xx = result['2xx'] !== undefined
                ? result.requests.total - result['2xx']
                : null;

            summary.push({
                connections,
                totalRequests: result.requests.total,
                reqPerSec: result.requests.average,
                latencyAvgMs: result.latency.average,
                latencyP99Ms: result.latency.p99,
                errors: result.errors,
                timeouts: timeoutCount,
                non2xx: result.non2xx,
                errorRate: (errorRate * 100).toFixed(2) + '%'
            });

            console.log(autocannon.printResult(result));

            // Stop early if things are clearly falling over
            if (errorRate > 0.05 || timeoutCount > 0) {
                console.log(`\n⚠️  High error/timeout rate detected at ${connections} connections. Stopping further steps.`);
                break;
            }
        } catch (err) {
            console.error(`Step at ${connections} connections failed:`, err.message);
            break;
        }

        // brief pause between steps so server can recover before next step
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n\n================ SUMMARY ================');
    console.table(summary);

    const healthy = summary.filter(s => parseFloat(s.errorRate) < 1 && s.timeouts === 0);
    if (healthy.length) {
        const best = healthy[healthy.length - 1];
        console.log(`\n✅ Highest connection count with low errors/timeouts: ${best.connections}`);
    } else {
        console.log('\n⚠️  Server showed errors/timeouts even at the lowest tested connection count. Try lowering STEPS.');
    }
}

main();