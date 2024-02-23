/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

//----- 以下是开关 (true 表示开启, false表示关闭)

/** 对地块Prefab根据坐标排序处理遮挡关系 */
let SORT_Z_INDEX = true;
/** 在无效的地块配置中, 填充调试用的地块 */
let FILL_DEBUG_AREA = false;
/** 全部按调试用的地块进行填充 */
let FILL_DEBUG_AREA_ALL = true;

//----------------------------------------
function getPosByXY(x, y) {
    let _BW = 136;
    let _BH = 98;
    let startX = _BW / 2;
    let startY = -_BH / 2;
    let PosX = startX + (x * 136) / 2;
    let posY = startY - (y * 98) / 2;
    return new cc.Vec2(PosX, posY);
}


const trace = Editor.log;
function doBuildAreas(areasAll) {
    SORT_Z_INDEX = confirm("要不要自动根据坐标进行排序?\n(建议 <ok>)"); 
    FILL_DEBUG_AREA_ALL = confirm("要不要全部显示为测试地格?\n(建议 <cancel>)");
    if(!FILL_DEBUG_AREA_ALL) FILL_DEBUG_AREA = confirm("要不要把有问题的显示为测试地格?\n(建议 <ok>)"); 

    let scene = cc.director.getScene();

    let areas = [];
    for(let i=0;i<areasAll.length;i++){
        let item = areasAll[i];
        if (!item) continue;
        if (!item.prefab) continue;
        if (item.area <= 0) continue;
        areas.push(item);
    }
    if (SORT_Z_INDEX) {
        areas.sort((a, b) => {
            // let aPos = getPosByXY(a.x, a.y);
            // let bPos = getPosByXY(b.x, b.y);
            // return bPos.y - aPos.y;
        if(a && b){
            let indexA = 10 * a.y + a.x;
            let indexB = 10 * b.y + b.x;
            return indexA-indexB;
        }
        return 0;
        });
    }


    let view = new cc.Node();
    view.name = "HomeMapPreview";
    scene.addChild(view);

    let tileWidth = 0;
    let tileHeight = 0;
    let offsetX = 0;
    let offsetY = 0;
    let prefab_path = "ea_prefab/home_v3/";

    for (let i = 0; i < areas.length; i++) {
        let item = areas[i];
        let index = 10 * item.y + item.x;
        trace("create", item.id, i, areas.length,index);

        if (!item) continue;
        if (!item.prefab) continue;
        if (item.area <= 0) continue;
        //套个节点, 显示 <id>=<Width>x<Height>
        let p = new cc.Node();
        p.name = item.id + "=" + item.width + "x" + item.height + " - " + item.prefab;
        p.position = getPosByXY(item.x, item.y);
        view.addChild(p);

        let itemPrefab = item.prefab;

        if (FILL_DEBUG_AREA_ALL) {
            itemPrefab = "debug/NUnlockTile_Debug_" + item.width + "x" + item.height;
        }
        cc.loader.loadRes(prefab_path + itemPrefab, (err, prefab) => {
            if (!err && prefab) {
                let node = cc.instantiate(prefab);
                p.addChild(node);
            }
            else if (FILL_DEBUG_AREA) {
                let debugPrefab = "debug/NUnlockTile_Debug_" + item.width + "x" + item.height;
                cc.loader.loadRes(prefab_path + debugPrefab, (err2, prefab2) => {
                    if (!err2 && prefab2) {
                        let node2 = cc.instantiate(prefab2);
                        p.addChild(node2);

                    }
                });
            }
        });


        // return;
    }
}




module.exports = {
    'buildAreas': function (sender, areas) {
        // trace("buildAreas", areas);
        doBuildAreas(areas);
    }
}