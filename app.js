const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const errorHandling = require('./middleware/errorHandling');

const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, './uni-project/frontend-app')));

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './uni-project/frontend-app/index.html'));
});

app.use(errorHandling);


app.listen(3000, () => {
    console.log('Listening On Port 3000');
});