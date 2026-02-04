const express = require('express')
const app = express()
const port = 3000

app.use(express.static('public'));
app.post('/backend', (req, res) => res.json({userName : 'Yassine' , date : Date.now().toLocaleString()}))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))