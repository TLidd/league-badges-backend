import express from 'express'
import bodyParser from 'body-parser'
import { getCurrentGame, getPlayerHistory, getLobbyNames} from './riotApiCalls.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 5000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsVal = cors();
app.use(corsVal);

app.get('/pingServer', (req, res) => {
  res.sendStatus(200);
})

app.get('/summonerGame/:name/:region', (req, res) => {
  let sumName = req.params.name;
  let region = req.params.region;
  getCurrentGame(sumName, region).then(data => {
    if(data == undefined){
      data = {};
      data.status = {message: 'Data not found', status_code: 404}
    }
    res.json(data);
  });
});

app.get('/summonerData/:name/:region', (req, res) => {
  let sumName = req.params.name;
  let region = req.params.region;
  getPlayerHistory(sumName, region).then(data => {
    if(data == undefined) res.sendStatus(404);
    else res.json(data);
  });
})

app.get('/getLobbyList/:name/:region', (req, res) => {
  let sumName = req.params.name;
  let region = req.params.region;
  getLobbyNames(sumName, region).then(data => {
    res.json(data);
  });
})

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});