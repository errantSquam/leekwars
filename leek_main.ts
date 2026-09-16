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

let maxEnemyRange = 0
for (let weapon of enemy.weapons) {
    maxEnemyRange = Math.max(maxEnemyRange, weapon.maxRange)

}

//todo: implement a star pathfinding and own leek range + maximum damage
function getImmediateSafeTiles(): Cell[] {
    let eRange = maxEnemyRange + enemy.maxMP
    let safeOffset = 1
    let cellArray: Cell[] = []
/*
<<<<<<< HEAD
    for (let x = -enemy.maxMP; x <= enemy.maxMP; x++) {
        let y = enemy.maxMP - Math.abs(x)
        cellArray.push(Field.cellFromXY(enemy.cell.x + x, enemy.cell.y + y))
        cellArray.push(Field.cellFromXY(enemy.cell.x + x, enemy.cell.y -y))
======
    for (int x = -enemy.maxMp - eRange - safeOffset; x <= enemy.maxMP + eRange + safeOffset; x++) {
        let y = enemy.maxMp - Math.abs(x)
        cellArray.append(Field.cellFromXY(x, y))
        cellArray.append(Field.cellFromXY(x, -y))
>>>>>>> 27777e6909a8b0e58408fa52b6c51c93cf545c6

    }*/
    return cellArray
}

function getNearestPathToSafety(): Cell[] {
    let safestPath: Cell[] = null
    let safeTilesArray = getImmediateSafeTiles()
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

    let eRange = maxEnemyRange + enemy.maxMP + 1
    console.log(`x: ${enemy.cell.x - eRange} to ${enemy.cell.x + eRange}`)

    console.log(`my coords: x @ ${me.cell.x}, y @ ${me.cell.y}`)

    let x_diff = 0
    let y_diff = 0

    if (me.cell.y < enemy.cell.y + eRange && 
    me.cell.y > enemy.cell.y - eRange) {
      y_diff = Math.abs(me.cell.y - enemy.cell.y)
      x_diff = Math.abs(eRange - y_diff)

      if (me.cell.x < enemy.cell.x + x_diff && me.cell.x > enemy.cell.x - x_diff) {
        return true
      }
    }

    if (me.cell.x < enemy.cell.x + eRange &&
    me.cell.x > enemy.cell.x - eRange) {
        x_diff = Math.abs(me.cell.x - enemy.cell.x)
        y_diff = Math.abs(eRange - x_diff)

        console.log(`y: ${ enemy.cell.y - y_diff} to ${enemy.cell.y + y_diff}`)

        if (me.cell.y < enemy.cell.y + y_diff 
        && me.cell.y > enemy.cell.y - y_diff) {

        return true
        }
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
        if (me.distance(enemy.cell) - me.weapon.maxRange < me.mp && 
        me.tp > me.weapon.cost && me.life/me.maxLife > 0.5){
            move_points = me.moveToward(enemy, 1)
        } else {
            if (!isInEnemyRange()) {
                move_points = me.moveToward(enemy, 1)
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


