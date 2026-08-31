import autocannon from 'autocannon';

autocannon({
    url: 'http://localhost:3000',
    connections: 50,
    duration: 20,
    requests: [
        { path: '/products?page=1' },
        { path: '/products?page=2' },
        { path: '/products?page=3' },
        { path: '/products?page=1&limit=5' },
        { path: '/products?page=4' } // likely a cache miss if you only seeded a few pages
    ]
}, (err, result) => {
    if (err) { console.error(err); return; }
    console.log(autocannon.printResult(result));
});