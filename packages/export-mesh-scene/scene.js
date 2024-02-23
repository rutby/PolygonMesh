/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const trace = Editor.log;
const fs = require('fs');
const path = require('path');


const PROJECT = Editor.Project;
const PROJECT_NAME = PROJECT.name;
const PROJECT_PATH = PROJECT.path;



/** 导出数据到那啥 */
function exportFile() {
    let scene = cc.director.getScene();
    // trace(scene.children[1].name);
    // var editContentNode = cc.find("test", scene);
    // if(!editContentNode) alert("请检查打开的场景是否正确 (场景未找到)");
    // if(editContentNode.children.length < 1) alert("请检查打开的场景是否正确 (节点结构不对)");
    var levelNode = scene.children[1];
    if(!levelNode) alert("请检查打开的预制是否正确 (预制未打开)");

   
    var fileName = levelNode.name;
    var data = [];

    let staticNode = levelNode.children[2];
    for(var i = 0; i < staticNode.children.length; i++){
        var symbolNode = staticNode.children[i];
        var symbolComponents = symbolNode._components;
        var symbolData = {};
        var isSymbol = false;
        for(var j = 0; j < symbolComponents.length; j++){
            var symbolComponent = symbolComponents[j];
            if(symbolComponent.exportConfig){
                var config = symbolComponent.exportConfig();
                // trace(config);
                symbolData[symbolComponent.__classname__] = config;
                isSymbol = true;
            }
        }
        if(isSymbol) data.push(symbolData);
    }

    // trace(JSON.stringify(data))
    //测试路径
    // fs.writeFileSync(path.join(PROJECT_PATH, "assets/test/" + fileName + ".json"), JSON.stringify(data));

    //正式路径
    // fs.writeFileSync(path.join(PROJECT_PATH, "../../../Client/assets/resources/RTS/mabControl/Prefab/levelCfg/" + fileName + ".json"), JSON.stringify(data));
    // 目标文件路径
    let filePath = path.join(PROJECT_PATH, "../../../Client/assets/resources/RTS/level_config/" + fileName + ".json");

    let originData = fs.readFileSync(filePath, 'utf-8');
    if(!originData) alert("没读到关卡文件");
    originData = JSON.parse(originData);
    originData.sd = data;
    trace(JSON.stringify(originData));
    // Editor.log("导出成功 -> ", fileName);
    alert("导出成功 -> " + fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(originData));
}


module.exports = {
	'exportMeshSceneJob': function (sender) {
        

        exportFile();
        return;


        //------


		// START_ERASE = confirm("是否要执行非法字符清理?\n执行意味着当前prefab下全部符合下列条件的文本都会被删除\n1.包含LocalComponent脚本\n2.被脚本引用\n\n运行完后请记得手动保存当前文件");
		// if (!START_ERASE) return;
        
        // 当前打开界面为场景
		let scene = cc.director.getScene();
        // trace(scene.children);
        // 3d障碍物节点父节点
        // let obstacleParent = cc.find("obstacleParent", scene);
        let singleLevelContent = cc.find("Canvas/editContentNode/singleLevelContent", scene); 
        trace(Object.keys(singleLevelContent));
        // 获取范围节点
        if(!singleLevelContent){
            trace("没找到场景节点");
            return;
        }

        let obj = {

        };

        let  contentRangeNoe = singleLevelContent.getChildByName("ContentRange");
        // 找到四个边界
        let bounding = contentRangeNoe.getBoundingBox();
        let x = bounding.x;
        let y = bounding.y;
        let w = bounding.width;
        let h = bounding.height;

        let lb = [x, y];
        let rb = [x + w, y];
        let rt = [x + w, y + h];
        let lt = [x, y + h];
        obj.range = [lb, rb, rt, lt];

        let staticData = [];
        obj.staticData = staticData;
        let  staticObstacle = singleLevelContent.getChildByName("StaticObstacle");
        let children = staticObstacle.children;
        for(let i = 0; i < children.length; i++){

            let oneStaticData = {};
            staticData[i] = oneStaticData;

            let node = children[i];
            let comps = node._components;
            for(let i = 0; i < comps.length; i++){
               
                if( comps[i].exportConfig){
                    let dataStr =  comps[i].exportConfig();
                    let comName = comps[i].__classname__;
                    oneStaticData[comName]=dataStr;
                }  
            }
            // trace(JSON.stringify(oneStaticData))
        }
        
        let storeString = JSON.stringify(obj);
        trace(storeString)
        let  levelPath = Editor.Project.path + "/../DrawInvasion3D_test/assets/resources/colorBattle/Prefab/level1";
        if(!fs.existsSync(levelPath)){
            fs.mkdirSync(levelPath);
        }

        function closeFd(fd) {
            fs.close(fd, (err) => {
                if (err) throw err;
            });
        }
            
        fs.open( levelPath + '/temp.txt', 'w+', (err, fd) => {
            if (err) throw err;
    
            try {
                // ftruncate(fd, 4, (err) => {
                // closeFd(fd);
                // if (err) throw err;
                // });
                trace("文件打开成功");
                fs.write(fd, storeString,  function(err) {
                    if (err) {
                        return trace(err);
                    }
                    trace("数据写入成功！");
                });
                
            } catch (err) {
                closeFd(fd);
            if (err) throw err;
            }
        });

        // 当前打开界面为节点
        // let obstacleParent = cc.find("3dObstacleNodeTemplate/obstacleParent", scene); 
        // for(let i = 0; i < obstacleParent.children.length; i++){
        //     trace(obstacleParent.children[i].name);
        // }

        // 目标路径
        // trace(Editor.Project.path + "/assets/resources/colorBattlePrefab/" + "level1");
      
        // let comps = obstacleParent.getComponentsInChildren(cc.MeshRenderer);

        // cutMesh(comps);
	}
};