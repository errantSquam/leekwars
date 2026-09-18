/** Exporté le 9/16/2026, 10:37:03 AM **/

/** leekful_leeker.ts **/

// @version:5.8
// Mon IA en TypeScript
const me = Fight.me // Mon entité



if (me.weapon === null) {
    me.setWeapon(Weapon.pistol) // On prend le pistolet (coûte 1 PT)
} 
const enemy = Fight.getNearestEnemy()

//Network.sendTo(enemy, Message.Type.CUSTOM, "it's so over for you")
const WIS_MULTIPLIER = (1 + me.wisdom)/100
const BANDAGE_MAX_HEAL = 28 * WIS_MULTIPLIER
const BANDAGE_THRESHOLD = BANDAGE_MAX_HEAL * 0.7

//todo: account for CHIPS
let maxEnemyRange = 0
for (let weapon of enemy.weapons) {
    if (weapon === null) {
        continue;
    }
    maxEnemyRange = Math.max(maxEnemyRange, weapon.maxRange)

}

function getBestTileToMoveTo(): Cell { 

    //Check offensive only? For now?
    //Should be computed once every round
    
    //bfs agaaain i guess
    //can cell.path to pathfind? Question mark
    let movementRangeArray = rangeBfs(enemy.maxMP, enemy.cell, [])
    let bestWeight = 0
    let bestMovementRange = 999999
    let bestCell = null

    for (let tile of movementRangeArray) {
        let moveDistance = me.cell.pathLength(tile)
        let enemyDistance = Field.getDistance(tile, enemy.cell)
        let currentWeight = 0
        //later check if this is less than bestmovementrange if weight is tied
        if (moveDistance > me.mp) {
            continue
        }
        if (tile.lineOfSight(enemy.cell) && enemyDistance < Weapon.pistol.maxRange) {
            currentWeight += 1
        }
        if (tile.onSameLine(enemy.cell) && enemyDistance < Weapon.machineGun.maxRange) {
            currentWeight += 1 //refactor these to a weapon function Later
        } 
        if (currentWeight >= bestWeight && moveDistance < bestMovementRange) {
            bestWeight = currentWeight
            bestMovementRange = moveDistance
            bestCell = tile
        }
        
        
    }

    return bestCell
}

function rangeBfs(range: number, currentCell: Cell, cellArray: Cell[]): Cell[] {
        
        function rangeBfsRecursive(range: number, currentCell: Cell) {
            //cellarray is the same as visited
            if (range === 0) {
                return
            }
            cellArray.push(currentCell)
            for (let x = currentCell.x - 1; x < currentCell.x + 1; x++) {
                for (let y = currentCell.y - 1; y < currentCell.y + 1; y++) {
                    let tempCell = Field.cellFromXY(x, y)
    
                    if (tempCell=== null){
                        continue
                    }
                    if (x === 0 && y === 0) {
                        continue
                    } else 
                    console.log(tempCell)
                    if (!cellArray.includes(tempCell) && !tempCell.obstacle) {
                        rangeBfsRecursive(range - 1, tempCell)
                    }
                }
            }
        }
        rangeBfsRecursive(range, currentCell)
        return cellArray
    }

let enemyRangeMemo: Cell [] = null
function getEnemyRange(): Cell[] {
    //get ranges for strongest weapon AND lineofsight
    //future optimization: get ranges for all weapons separately, check if there's enough time to iterate through em all.
    //or if there's a way to store in memory to better optimize
    //also maybe refactor range to be added on top of current pos? or like store it somewhere so i dont have to recalc

    if (enemyRangeMemo !== null) {
        return enemyRangeMemo
    }
    //let eRange = maxEnemyRange + enemy.maxMP
    

    
    //New problem: Need to BFS for every tile possible. Crying laughing emoji
    //just bfs it
    
    let movementRangeArray = rangeBfs(enemy.maxMP, enemy.cell, [])
    let attackRangeArray = movementRangeArray.map(a => {return {...a}})

    for (let tile of movementRangeArray) {
        attackRangeArray = rangeBfs(maxEnemyRange, tile, attackRangeArray)
    }
    

    

    enemyRangeMemo = attackRangeArray
    return attackRangeArray
    
}

let safeTilesMemo: Cell[] = null
function getImmediateSafeTilesV2(): Cell[] {
    //for future improvement: figure out how to get the edge tiles only.
    if (safeTilesMemo !== null) {
        return safeTilesMemo
    }
    let enemyRange = getEnemyRange()
    let safeTiles = []
    for (let tile of enemyRange) {
        for (let x = tile.x - 1; x < tile.x + 1; x++) {
            for (let y = tile.y - 1; y < tile.y + 1; y++) {
                let tempCell = Field.cellFromXY(x, y)
                if (!enemyRange.includes(tempCell)) {
                    safeTiles.push(tempCell)
                }
            }
        }
    }
    safeTilesMemo = safeTiles
    return safeTiles
    
}
//todo: implement a star pathfinding and own leek range + maximum damage
function getImmediateSafeTiles(): Cell[] {
    let eRange = maxEnemyRange + enemy.maxMP
    let safeOffset = 1
    let cellArray: Cell[] = []
    
    for (let x = -enemy.maxMP - eRange - safeOffset; x <= enemy.maxMP + eRange + safeOffset; x++) {
        let y = enemy.maxMP - Math.abs(x)
        cellArray.push(Field.cellFromXY(enemy.cell.x + x, enemy.cell.y + y))
        cellArray.push(Field.cellFromXY(enemy.cell.x + x, enemy.cell.y -y))

    }
    return cellArray
}

function getNearestPathToSafety(): Cell[] {
    let safestPath: Cell[] = null
    let safeTilesArray = getImmediateSafeTilesV2()
    for (let tile of safeTilesArray) {
        let currentPath = me.cell.path(tile)
        console.log(`Current Path: ${currentPath}`)
        if (currentPath !== null && (safestPath === null || currentPath.length < safestPath.length)) {
            console.log("Appending")
            safestPath = currentPath
        }
    }
    return safestPath
}


function isInEnemyRange(): boolean {

    if (getEnemyRange().includes(me.cell)){
        return true
    }
    return false

}

function shoot(): boolean {
    let fight_status: Fight.Use = me.useWeapon(enemy)
        //console.log(fight_status)
        switch (fight_status) {
            case Fight.Use.CRITICAL:
            case Fight.Use.SUCCESS:
                console.log("Shoot success")
                return true
                break;
            default:
                return false;
        }
}

function getStrongestAvailableWeapon(): Weapon {
    let strongestWeapon: Weapon = null;
    let maxDamage = 0
    for (let weapon of me.weapons) {
        if (me.canUseWeapon(enemy, weapon)) {
            if (strongestWeapon === null || weapon.passiveFeatures) {
                let min_damage = weapon.features[0].minValue * weapon.features.length;
                let max_damage = weapon.features[0].maxValue * weapon.features.length;
                let average_damage = (min_damage + max_damage)/2
                if (average_damage > maxDamage && 
                me.canUseWeapon(enemy, weapon)) {
                    let cost = weapon.cost
                    if (me.weapon !== weapon) {
                        cost += 1 
                    }
                    if (me.tp >= cost) {
                        strongestWeapon = weapon
                        maxDamage = average_damage
                    }
                }
            }
        }
    }
    return strongestWeapon
}

let bandageUses = 1
let bestOffensiveTile = getBestTileToMoveTo()

while (me.mp > 0) {
    console.log("Looping")
    let strongestWeapon = getStrongestAvailableWeapon()
    if (me.tp >= Chip.protein.cost && Chip.protein.currentCooldownOf(me) === 0) {
        me.useChip(Chip.protein)
    }
    if (me.tp >= Chip.bandage.cost && me.maxLife - me.life > BANDAGE_THRESHOLD 
    && bandageUses > 0
    ) {
            me.useChip(Chip.bandage)
            bandageUses -= 1
    } else if (strongestWeapon !== null){
        if (me.weapon != strongestWeapon) {
            me.setWeapon(strongestWeapon)
        }
        shoot()
        
    } else if (me.tp >= Chip.shock.cost && me.canUseChip(Chip.shock, enemy)){
        me.useChip(Chip.shock, enemy)

    } else {
        console.log("Moving")
        let move_points = 0
        if (bestOffensiveTile != 1 && 
        me.tp > me.weapon.cost && me.life/me.maxLife > 0.5){
            move_points = me.moveTowardCells([bestOffensiveTile], 1)
        } else {
            if (!isInEnemyRange() && !getImmediateSafeTiles().includes(me.cell)) {
                move_points = me.moveTowardCells([bestOffensiveTile], 1)
            }
        } 
        
        if (me.mp === 0 || move_points === 0) {
            break;
        }
    }
}
if (isInEnemyRange()) {
    console.log("In enemy range!")
    let nearestSafePath = getNearestPathToSafety()
    console.log(nearestSafePath)
    if (nearestSafePath!==null) {
        for (let tile of nearestSafePath) {
            me.moveTowardCells(tile)
        }
    } else {
        me.moveAwayFrom(enemy)
    }
}


