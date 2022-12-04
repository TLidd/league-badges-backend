export function createBadge(badgePoints, gamesPlayed){
    let avgBadgePoints = (badgePoints/gamesPlayed).toFixed(3);
    if(avgBadgePoints > 1.75){
        return 2;
    }
    else if(avgBadgePoints > 1.5){
        return 1;
    }
    else if(avgBadgePoints > 1.25){
        return 0;
    }
}

export function createBadgeList(badgeData, gamesPlayed){
    let badges = {};
    for(const key of Object.keys(badgeData)){
        let badgeLevel = createBadge(badgeData[key], gamesPlayed);
        if(badgeLevel !== undefined){
            badges[key] = badgeLevel;
        }
    }
    return badges;
}

export function createFBBadge(fbTotal, gamesPlayed){
    let percentage = (fbTotal / gamesPlayed)*100;
    if(percentage >= 30 && percentage < 40){
        return 0;
    }
    else if(percentage >= 40 && percentage < 50){
        return 1;
    }
    else if(percentage >= 50){
        return 2;
    }
}

export function getMainRole(rolesPlayed){
    let max = 0;
    let mostPlayed = null;
    for(let key in rolesPlayed){
        if(max < rolesPlayed[key]){
            mostPlayed = key;
            max = rolesPlayed[key];
        }
    }
    return mostPlayed;
}

export function orderObj(Obj){
    return Object.entries(Obj).sort(([,a],[,b]) => b-a).reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
}