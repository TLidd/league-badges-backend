import express from 'express'
import bodyParser from 'body-parser'
import { getCurrentGame, getLobbyData, getPlayerHistory, getLobbyNames, setRiotLimiter } from './riotApiCalls.js';
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

app.get('/summonerGame/:name', (req, res) => {
  let sumName = req.params.name;
  getCurrentGame(sumName).then(data => {
    res.json(data);
  });
});

app.get('/summonerData/:name', (req, res) => {
  let sumName = req.params.name;
  getPlayerHistory(sumName).then(data => {
    res.json(data);
  });
})

app.get('/lobbyData/:name', (req, res) => {
  let sumName = req.params.name;
  getLobbyData(sumName).then(data => {
    res.json(data);
  });
})

app.get('/getLobbyList/:name', (req, res) => {
  let sumName = req.params.name;
  getLobbyNames(sumName).then(data => {
    res.json(data);
  });
})

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

setRiotLimiter();