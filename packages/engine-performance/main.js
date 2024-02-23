'use strict';
// const biTool = require('./bi-tool.js');
const os = require("os");
const systeminformation = require("systeminformation");
const fs = require("fire-fs");
const path = require("path");


/**
 * 记录函数替换的对象，用于还原
 * @type {{}}
 */
const _cacheInfo = {};

/**
 * 设备信息未获取到时，记录bi数据，等待
 * @type {*[]}
 */
const waitForBiList = [];

/**
 * 从systeminformation获取的系统信息
 * @type {null}
 */
let systemInfo = null;
/**
 * 从systeminformation获取的cpu信息
 * @type {null}
 */
let cpuInfo = null;

/**
 * 使用BI，为false时不进行函数替换
 * @type {boolean}
 */
let useBi = true;

/**
 * 是否已经替换过函数
 * @type {boolean}
 */
let inited = false;

/**
 * 当前编辑器使用的优化版本
 * v0.0.0表示无优化
 */
let optimzVersion = 'v0.0.0';

// 保存编辑器操作状态（构建、编译、通常使用），给BI打点用于区分
let editorCommand = {
    buildCommand: Editor._buildCommand,
    compileCommand: Editor._compileCommand,
};

/**
 * 替换函数
 * @param fromObj 记录函数的对象
 * @param funcName 函数名
 * @param biName 记录以及bi的名称，不能重复
 * @param newFunc 新函数
 */
function replaceFunc(fromObj, funcName, biName, newFunc) {
    if (typeof fromObj[funcName] !== 'function') {
        console.warn(`${funcName} 替换的必须是函数`);
        return;
    }
    let realObj = fromObj;

    while (!realObj.hasOwnProperty(funcName)) {
        realObj = Object.getPrototypeOf(fromObj);
    }

    _cacheInfo[biName] = {
        fromObj: fromObj,
        realObj: realObj,
        oldFunc: realObj[funcName],
        funcName: funcName,
        biName: biName,
    };
    if (realObj[funcName].constructor.name === 'AsyncFunction') {
        fromObj[funcName] = async function () {
            await newFunc.call(this, _cacheInfo[biName], arguments);
        };
    } else {
        fromObj[funcName] = function () {
            newFunc.call(this, _cacheInfo[biName], arguments);
        };
    }
    console.log(`替换 ${biName} 完成`);
}

/**
 * 简单替换异步函数，直接用await记录开始和结束时间
 * @param fromObj 函数所在对象
 * @param funcParentName 函数所在对象名
 * @param funcName 函数名
 * @param biName 记录以及bi的名称，不能重复
 * @param sendSimpleBi 是否发送bi
 * @param callback 函数状态回调 ('before'|'after', date)
 */
function simpleReplaceAsyncFunc(fromObj, funcParentName, funcName, biName, sendSimpleBi=true, callback=null ){
    replaceFunc(fromObj, funcName, biName, async function (cacheInfo, args) {
        let biName = cacheInfo.biName;
        let oldFn = cacheInfo.oldFunc;
        let funcName = cacheInfo.funcName;
        let paramList = getParamList(args);

        let start = Date.now();
        if(callback){
            callback('before', start);
        }
        await oldFn.call(this, ...args);
        let end = Date.now();
        if(callback){
            callback('after', end);
        }
        if(sendSimpleBi)
        {
            let costTime = end - start;
            sendFuncCostToBI({
                biName: biName,
                funcName: funcName,
                funcParent: funcParentName,
                paramList: paramList,
                costMs: costTime,
            });
        }
    });
}

/**
 * 还原函数
 * @param biName
 */
function restoreFunc(biName) {
    let funcInfo = _cacheInfo[biName];
    let funcName = funcInfo['funcName'];
    if (!funcInfo.fromObj[funcName]) {
        console.log(`fromObj中无此项，请确认 ${funcName} 是否存在`);
        return;
    }

    if (funcInfo.fromObj === funcInfo.realObj) {
        // 还原函数
        funcInfo.fromObj[funcName] = funcInfo.oldFunc;
    } else {
        // 函数在原型上，直接删除当前函数记录
        delete funcInfo.fromObj[funcName];
    }

    delete _cacheInfo[funcName];
    console.log(`复原 ${biName} 完成`);
}

/**
 * 替换所有函数
 */
function enableBI() {
    if (!useBi) {
        console.log("未设置使用BI，跳过函数替换");
        refreshOptimizeVersion(false);
        return;
    }

    if (inited) {
        console.log("已经开启BI，跳过函数替换");
        return;
    }

    // 从编辑器global中获取当前的优化功能的版本
    refreshOptimizeVersion(true);

    let tasks = Editor.require('app://asset-db/lib/tasks');
    replaceFunc(tasks, 'queryAssets', 'Tasks.queryAssets',
        function (cachedInfo, args) {
            // assetdb, fspathPattern, assetTypes, cb
            let oldFn = cachedInfo.oldFunc;
            let biName = cachedInfo.biName;
            let funcName = cachedInfo.funcName;

            let assetdb = args[0];
            let fspathPattern = args[1];
            let assetTypes = args[2];
            let callback = args[3];
            let startDate = Date.now();

            let newCb = function(err, results){
                callback(err, results);

                let endDate = Date.now();
                let costTime = endDate - startDate;
                console.log(`${biName} cost ${costTime} ms, url:${fspathPattern}, assetTypes: ${assetTypes}, results: ${results.length}`);
                let paramList = getParamList([fspathPattern, assetTypes, callback]);
                sendFuncCostToBI({
                    biName: biName,
                    funcName: funcName,
                    funcParent: 'Tasks',
                    paramList: paramList,
                    costMs: costTime,
                    searchResult: results.length,
                });
            };
            oldFn.call(this, assetdb, fspathPattern, assetTypes, newCb);
        });


   /* replaceFunc(Editor.assetdb, 'queryAssets', 'Editor.assetdb.queryAssets',
        function (cacheInfo, args) {
            let oldFn = cacheInfo.oldFunc;
            let biName = cacheInfo.biName;
            let funcName = cacheInfo.funcName;
            // s
            let patternPath = args[0];
            // e
            let url = args[1];
            // a
            let callback = args[2];
            let startDate = Date.now();

            let newCb = function (err, results) {

                callback(err, results);

                let endDate = Date.now();
                let costTime = endDate - startDate;
                console.log(`${biName} cost ${costTime} ms, url:${patternPath}, assetTypes: ${url}, results: ${results.length}`);
                let paramList = getParamList([patternPath, url, callback]);
                sendFuncCostToBI({
                    biName: biName,
                    funcName: funcName,
                    funcParent: 'Editor.assetdb',
                    paramList: paramList,
                    costMs: costTime,
                    searchResult: results.length,
                });
            };
            oldFn.call(this, patternPath, url, newCb);
        });*/


    // WatchOFF函数内部有task任务，不方便直接获取到，所以替换asset-db的事件回调来获取结果
    replaceFunc(Editor.assetdb, '_eventCallback', 'Editor.assetdb.watchOFF',
        function (cacheInfo, args) {
            let oldFn = cacheInfo.oldFunc;
            let biName = cacheInfo.biName;
            let funcName = cacheInfo.funcName;

            oldFn.call(this, ...args);

            let eventName = args[0];
            let param = args[1];
            if (eventName === "asset-db:watch-state-changed") {
                if (param === "watch-stopping") {
                    _cacheInfo["asset-db:watch-state-changed.watch-stopping"] = Date.now();
                } else if (param === "watch-off") {
                    let startDate = _cacheInfo["asset-db:watch-state-changed.watch-stopping"];
                    if (startDate) {
                        let endDate = Date.now();
                        let costTime = endDate - startDate;
                        delete _cacheInfo["asset-db:watch-state-changed.watch-stopping"];
                        sendFuncCostToBI({
                            biName: biName,
                            funcName: funcName,
                            funcParent: 'Editor.assetdb',
                            paramList: [eventName, param],
                            costMs: costTime,
                        });
                    }
                }
            }
        }
    );

    let ProjectCompilerFuncParent = 'Editor.ProjectCompiler';

    simpleReplaceAsyncFunc(Editor.ProjectCompiler, ProjectCompilerFuncParent, "init", `${ProjectCompilerFuncParent}.init`);
    simpleReplaceAsyncFunc(Editor.ProjectCompiler, ProjectCompilerFuncParent, "compileAndReload", `${ProjectCompilerFuncParent}.compileAndReload`);
    simpleReplaceAsyncFunc(Editor.ProjectCompiler, ProjectCompilerFuncParent, "compileScripts", `${ProjectCompilerFuncParent}.compileScripts`);
    simpleReplaceAsyncFunc(Editor.ProjectCompiler, ProjectCompilerFuncParent, "moveScripts", `${ProjectCompilerFuncParent}.moveScripts`);
    simpleReplaceAsyncFunc(Editor.ProjectCompiler, ProjectCompilerFuncParent, "removeScripts", `${ProjectCompilerFuncParent}.removeScripts`);

    let AssetDBParent = 'Editor.AssetDB';
    simpleReplaceAsyncFunc(Editor.AssetDB, AssetDBParent, 'init', `${AssetDBParent}.init`);

    // 理论上只会被编辑器初始化时调用
    let EditorEngineParent = 'Editor.Engine';
    simpleReplaceAsyncFunc(Editor.Engine, EditorEngineParent, 'build', `${EditorEngineParent}.build`, false,
        (state, dateNow) => {
            if (state === 'before') {
                _cacheInfo['EditorEngineBuildStart'] = dateNow;
            }
        }
    );

    replaceFunc(Editor.App, 'run', 'Editor.App.run',
        function (cacheInfo, args) {
            let oldFn = cacheInfo.oldFunc;
            let biName = cacheInfo.biName;
            let funcName = cacheInfo.funcName;
            let editorRunStart = Date.now();
            let EditorEngineBuildStartDate = _cacheInfo['EditorEngineBuildStart'];
            if(EditorEngineBuildStartDate){
                let editorLoadCostMs = editorRunStart - EditorEngineBuildStartDate;
                sendFuncCostToBI({
                    biName: 'EditorLoad',
                    funcName: '',
                    funcParent: '',
                    paramList: [],
                    costMs: editorLoadCostMs,
                });
            }
            oldFn.call(this, ...args);
        }
    );


    inited = true;
    console.log("Enable BI");
}

/**
 * 发送从engine.build开始到editor:ready的bi
 */
function sendStartupBi(){
    let EditorEngineBuildStartDate = _cacheInfo['EditorEngineBuildStart'];
    if (!EditorEngineBuildStartDate) {
        return;
    }
    delete _cacheInfo['EditorEngineBuildStart'];

    let editorReadyDate = Date.now();
    let costMs = editorReadyDate - EditorEngineBuildStartDate;
    sendFuncCostToBI({
        biName: 'EditorStartup',
        funcName: '',
        funcParent: '',
        paramList: [],
        costMs: costMs,
    });
}


/**
 *  还原全部记录
 */
function disableBI() {
    if (!inited) {
        console.log("未开启过BI，无需还原");
        return;
    }
    refreshOptimizeVersion(false);

    let keyArray = Object.keys(_cacheInfo);
    for (let index = 0; index < keyArray.length; index++) {
        let key = keyArray[index];
        restoreFunc(key);
    }

    inited = false;
    console.log("Disable BI");
}

/**
 * 将参数转换为字符串，用于bi的json列表
 * @param paramList 参数的数组
 * @returns {*[]} 转化后的数组
 */
function getParamList(paramList) {
    let returnParamList = [];
    for (let i = 0; i < paramList.length; i++) {
        let v = paramList[i];
        if (v === null) {
            returnParamList.push("null");
        } else if (typeof v == "function") {
            returnParamList.push("function");
        } else if (v.toString) {
            returnParamList.push(v.toString());
        } else {
            returnParamList.push("unknown");
        }
    }
    return returnParamList;
}

/**
 * 补全系统所需参数
 * @param eventInfoMap
 */
function fillSystemInfo(eventInfoMap) {
    eventInfoMap['deviceModel'] = systemInfo.model;
    eventInfoMap['processorType'] = `${cpuInfo.manufacturer} ${cpuInfo.brand} ${cpuInfo.speed}`;
    // 操作系统，获取"darwin"对应mac系统，"win32"对应win系统
    eventInfoMap['run_os'] = os.platform();
}

function loadSystemFinished() {
    if (systemInfo && cpuInfo) {
        if (waitForBiList.length > 0) {
            while (waitForBiList.length > 0) {
                let info = waitForBiList.pop();
                sendFuncCostToBI(info);
            }
        }
    }
}

/**
 * 向BI发送打点数据
 * @param eventInfoMap
 */
function sendFuncCostToBI(eventInfoMap) {
    // 给BI打点设置当前编辑器的优化版本记录
    eventInfoMap.optimzVersion = optimzVersion;
    // 保存编辑器状态
    eventInfoMap.editorCommandObj = editorCommand;

    if (!systemInfo || !cpuInfo) {
        waitForBiList.push({
            eventInfoMap
        });
    } else {
        fillSystemInfo(eventInfoMap);
        const biTool = Editor.require('packages://engine-performance/bi-tool.js');
        biTool.sendEvent("CallFunc", eventInfoMap);
    }
}

function onBuildFinish(options, callback){
    // 构建完成时，回调打印构建中的setting，用于在jenkins中记录构建引用的包信息
    // if(global.funcCost){
    //     global.funcCost.printCount(true);
    // }
    console.log(options.settings);
    callback();
}

/**
 * 重新刷新bi状态
 * @param isEnableBi
 */
function refreshOptimizeVersion(isEnableBi){
    // 从编辑器global中获取当前的优化功能的版本
    if(global.funcCost){
        let funcCost = global.funcCost;
        if(funcCost.getVersion){
            optimzVersion = funcCost.getVersion();
        }
    }
    // 如果存在自定义template，则将数据写入自定义配置，用于boot中的bi开关和版本号记录
    let previewTemplateUrl = path.join(Editor.Project.path, 'preview-templates');

    // 存在自定义预览才需要写入配置
    if(fs.existsSync(previewTemplateUrl)){
        let configJsonDir = path.join(previewTemplateUrl, 'configs');
        let configJsonPath = path.join(configJsonDir, 'options.json');
        let jsonObj = {};

        fs.ensureDirSync(configJsonDir);
        if(fs.existsSync(configJsonPath)){
            jsonObj = fs.readJSONSync(configJsonPath);
        }
        jsonObj.biConfig = Object.assign(jsonObj.biConfig || {},
            {
                enableBi: !!isEnableBi,
                optimzVersion: optimzVersion,
            });
        fs.writeJSONSync(configJsonPath, jsonObj);
    }
}

module.exports = {
    load() {
        Editor.log(`load bi tool`);
        // 插件加载时获取系统信息
        systeminformation.cpu().then(data => {
            cpuInfo = data;
            loadSystemFinished();
        });
        systeminformation.system().then(data => {
            systemInfo = data;
            loadSystemFinished();
        });
        Editor.Builder.on('build-finished', onBuildFinish);
        enableBI();
    },
    unload() {
        Editor.Builder.removeListener('build-finished', onBuildFinish);
        disableBI();
    },
    messages: {
        'engine-performance:enable-bi': function () {
            enableBI();
        },
        'engine-performance:disable-bi': function () {
            disableBI();
        },
        // 'engine-performance:test-send': function () {
        //     sendFuncCostToBI({});
        // }
        'editor:ready': function () {
            sendStartupBi();
        }
    }
};