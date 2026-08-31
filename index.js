import app from './app.js';
import connectDB from './utils/connectDatabase.js';

await connectDB();

app.listen(3000, () => console.log('server working...'));