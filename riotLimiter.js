import fetch from "node-fetch";
import Bottleneck from "bottleneck";

export default class riotLimiter{
    #limiterMaxCalls;
    #callsPerSecond;
    #maxCallsTimeSeconds;

    #currentFetchCalls = 0;
    #riotHeaderMax = 0;

    #startAPITime;

    #timer;
    #timerSet = false;

    #limiter = new Bottleneck({
        reservoir: 20, // initial value
        reservoirRefreshAmount: 20,
        reservoirRefreshInterval: 1.25 * (1000), // must be divisible by 250
        maxConcurrent: 20,
        minTime: 1250 / 20,
    })

    constructor(limiterMaxCalls = 100, maxCallsTimeSeconds = 120, callsPerSecond = 20){
        this.#limiterMaxCalls = limiterMaxCalls;
        this.#callsPerSecond = callsPerSecond;
        this.#maxCallsTimeSeconds = maxCallsTimeSeconds;
    }

    async getFetchData(fetchURL, retries = 3){
        if(this.#currentFetchCalls == 0 || !this.#timerSet){
            this.#setTimer();
        }

        if(this.#currentFetchCalls > this.#limiterMaxCalls){
            await this.#delay(this.#getTimeLeft(this.#timer));
        }

        let res = await this.#limiter.schedule(() => {
            this.#currentFetchCalls += 1;
            if(this.#currentFetchCalls <= this.#limiterMaxCalls){
                return fetch(fetchURL);
            }
        });

        if(!res){
            return this.getFetchData(fetchURL);
        }

        let data;
        if(res){
            data = await res.json();
        }

        if(data?.status?.status_code == 429 && retries != 0){
            console.log(data);
            return this.getFetchData(fetchURL, retries - 1);
        }

        return data;
    }

    #setTimer(){
        this.#startAPITime = Date.now();
        this.#timerSet = true;
        this.#timer = setTimeout(() => {
            this.#currentFetchCalls = 0;
            this.#timerSet = false;
            this.#riotHeaderMax = 0;
        }, (this.#maxCallsTimeSeconds * 1000) + 5000)
    }

    #getTimeLeft(timeout) {
        return Math.ceil((125000 - (Date.now() - this.#startAPITime)) / 1000);
    }

    #delay(seconds){
        return new Promise(resolve => setTimeout(resolve, seconds * 1000))
    }

    async setRateLimits(){
        let res = await fetch(`https://na1.api.riotgames.com/lol/status/v3/shard-data?api_key=${process.env.RIOT_KEY}`);
        let [rate1, rate2] = this.#getRateLimitHeader(res.headers.get('X-App-Rate-Limit'));
        this.#callsPerSecond = rate1[0];
        this.#maxCallsTimeSeconds = rate2[1];
        this.#limiterMaxCalls = rate2[0];

        this.#limiter = new Bottleneck({
            reservoir: this.#callsPerSecond,
            reservoirRefreshAmount: this.#callsPerSecond,
            reservoirRefreshInterval: 1.25 * (1000),
            maxConcurrent: this.#callsPerSecond,
            minTime: 1.25 * (1000) / this.#callsPerSecond,
        })
    }

    #getRateLimitHeader(rateString){
        let rates = rateString.split(',');
        let rate1 = rates[0].split(':');
        let rate2 = rates[1].split(':');
        return [rate1, rate2];
    }

    #setriotHeaderMax(rateString){
        let [rate1, rate2] = this.#getRateLimitHeader(rateString);
        if(parseInt(rate2[0]) > this.#riotHeaderMax){
            this.#riotHeaderMax = parseInt(rate2[0]);
        }
    }

    printInfo(){
        let green = '\x1b[32m';
        let red = "\x1b[31m";

        if(this.#currentFetchCalls == this.#limiterMaxCalls){
            console.log(`${green}%s\x1b[0m`, 'Limiter Max Reached');
        }
        if(this.#currentFetchCalls > this.#limiterMaxCalls){
            console.log(`${red}%s\x1b[0m`, 'Limiter overflowed');
        }
    }

}