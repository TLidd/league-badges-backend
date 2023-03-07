import championHistory from './leagueChampion.js';
import { createFBBadge, createBadgeList, getMainRole, orderObj } from './leagueDataFunctions.js';

class leaguePlayer{
    name = null;
    matchHistory = null;
    gamesPlayed = null;
    puuid = null;

    constructor(name, puuid, matchHistory, tier, rank){
        this.name = name;
        this.puuid = puuid;
        this.matchHistory = matchHistory;
        this.playerData.SummonerName = name;
        this.playerData.tier = tier;
        this.playerData.rank = rank;
        if(matchHistory) this.gamesPlayed = matchHistory.length;
        this.#processMatches();
    }

    playedRoles = {
        "TOP" : 0,
        "JUNGLE" : 0,
        "MIDDLE" : 0,
        "BOTTOM" : 0,
        "UTILITY" : 0,
    }

    //https://github.com/ngryman/lol-spells/blob/master/spells.json for reference.
    summonerSpellIds = {
        "1": "Boost",
        "3": "Exhaust",
        "4": "Flash",
        "6": "Haste",
        "7": "Heal",
        "11": "Smite",
        "12": "Teleport",
        "32": "Mark",
        "13": "Clarity",
        "14": "Dot",
        "21": "Barrier",
    }

    /*badges are to describe the players playstyle
          (0-2) represents the level the player is at. example of aggro
          2 being a very aggressive player, 0 being a very passive player.*/
    
    playerData = {
        SummonerName: "",
        Role: "",
        tier: null,
        rank: null,
        badges: {},
        champions: {},
        matchHistory: {
            wins: 0,
            losses: 0,
            games: []
        }
    }

    //process the data by getting the different badges to describe the player (ranked games only)
    #processMatches(){
        for(const match of this.matchHistory){
            if(match?.hasOwnProperty('info')){
                if(match?.info?.participants){
                    let player = this.#getPlayerMatchStats(match.info.participants);
                    if(player){
                        this.playerData.matchHistory.wins 
                        this.playedRoles[player.teamPosition] += 1;

                        let champion = player.championName;
                        
                        this.#processGame(player);

                        if(this.playerData.champions[champion] === undefined){
                            this.playerData.champions[champion] = new championHistory(champion);
                        }

                        this.playerData.champions[champion].processChampData(match);
                    }
                }
            }
        }
        //after all matches processed create the data for the champions and players
        this.#createChampionData();
        this.#createPlayerData();
    }

    //get the data of the player from the player's match
    #getPlayerMatchStats(players){
        let playerStats = players.find(player => {
            if(player.puuid == this.puuid){
                return player;
            }else if(player.summonerName == this.name){
                return player;
            }
        });
        return playerStats;
    }

    // fill the PlayerData object with the champion stats/badges and create overall badges for the player
    #createPlayerData(){
        let data = null;
        for(const champion of Object.values(this.playerData.champions)){
            let championBadgeData = champion.getChampionBadgeData();
            if(data === null){
                data = championBadgeData;
            }
            else{
                for(const key of Object.keys(data)){
                    data[key] += championBadgeData[key];
                }
            }
        }
        if(data){
            this.playerData.badges = createBadgeList(data, this.gamesPlayed);

            let fbBadgeLevel = createFBBadge(data.firstBloods, this.gamesPlayed);
            if(fbBadgeLevel >= 0){
                this.playerData.badges.firstBloods = fbBadgeLevel;
            }
        }

        this.playerData.Role = getMainRole(this.playedRoles);
        this.playerData.badges = orderObj(this.playerData.badges);
        this.playerData.champions = this.#orderChamps();
    }

    //create the badges and stats of the champions played
    #createChampionData(){
        for(const champion of Object.values(this.playerData.champions)){
            champion.createChampionBadges();
            champion.createChampStats();
        }
    }

    //process this particular match for the player
    #processGame(playerInfo){
        if(playerInfo.win) this.playerData.matchHistory.wins += 1;
        let playerItems = [playerInfo.item0, playerInfo.item1, playerInfo.item2, playerInfo.item3, playerInfo.item4, playerInfo.item5, playerInfo.item6]
        let matchInfo = {
            win: playerInfo.win,
            kills: playerInfo.kills,
            assists: playerInfo.assists,
            deaths: playerInfo.deaths,
            champion: playerInfo.championName,
            items: playerItems,
            spell1: this.summonerSpellIds[playerInfo.summoner1Id],
            spell2: this.summonerSpellIds[playerInfo.summoner2Id],
            gameStats: {
                "Total Damage Dealt": playerInfo.totalDamageDealtToChampions,
                "Total Damage Taken": playerInfo.totalDamageTaken,
                "Total Vision Score": playerInfo.visionScore,
                "Total Gold Earned": playerInfo.goldEarned,
                "Total Minions Killed": playerInfo.totalMinionsKilled + playerInfo.neutralMinionsKilled,
                "Turret Takedowns": playerInfo.turretTakedowns,
                "Allies Shielded": playerInfo.totalDamageShieldedOnTeammates,
                "Allies Healed":  playerInfo.totalHealsOnTeammates,
            }
        }
        this.playerData.matchHistory.games.push(matchInfo);
    }

    getPlayerData(){
        this.playerData.matchHistory.losses = this.gamesPlayed - this.playerData.matchHistory.wins;
        return this.playerData;
    }

    #orderChamps(){
        return Object.entries(this.playerData.champions).sort(([,a], [,b]) => b.champData.gamesPlayed - a.champData.gamesPlayed).reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    }

    printData(){
        console.log(JSON.stringify(this.playerData, null, 4));
    }
}

export default leaguePlayer;