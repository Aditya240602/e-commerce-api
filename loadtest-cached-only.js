import autocannon from 'autocannon';

// Runs the same mixed cached/uncached request pattern at increasing
// concurrency levels, one after another, so you can see exactly where
// error rate and tail latency start climbing instead of jumping straight
// to 900 and only seeing the worst case.
const levels = [200, 400, 600, 900];

const requests = [
    { path: '/products?page=1' },
    { path: '/products?page=2' },
    { path: '/products?page=3' },
    { path: '/products?page=1&limit=5' },
    { path: '/products?page=4' } // guaranteed-miss, same as the original test
];

async function run() {
    for (const connections of levels) {
        console.log(`\n=== ${connections} connections ===`);
        const result = await autocannon({
            url: 'http://localhost:3000',
            connections,
            duration: 15,
            requests
        });
        console.log(autocannon.printResult(result));
        // brief pause between levels so the cache/pool can settle before the next run
        await new Promise(r => setTimeout(r, 3000));
    }
}

run();