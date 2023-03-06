/**
 * 
 * @param {Number} badgePoints 
 * @param {Number} gamesPlayed 
 * @returns a score between (0-2) that indicates the badge level (2 being the best).
 */
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

/**
 * 
 * @param {Object} badgeData the badge list
 * @param {Number} gamesPlayed 
 * @returns a badge object that maps the key to the level based on the average points for the games played.
 */
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

/**
 * 
 * @param {Number} fbTotal 
 * @param {Number} gamesPlayed 
 * @returns the badge level for first bloods based on a percentage over their games played.
 */
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

/**
 * 
 * @param {Object} rolesPlayed 
 * @returns most played role
 */
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