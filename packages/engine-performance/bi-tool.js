'use strict';

/**
 * BI工具类，逻辑和函数命名参照引擎组的C#版实现
 */
const {machineId, machineIdSync} = require('node-machine-id');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const k_VersionCode = "1";
// 编辑器的启动时间，因为插件每次修改会重新load，所以这里可能会不准
const startupTime = Date.now();
// 保存设备id信息，减少反复获取
let machineIdStr = '';

// export default {
//     SendGroupEvents,
//     SendEditorUseFunctionEvent,
//     SendEvent,
// }

module.exports = {
    sendGroupEvents,
    sendEditorUseFunctionEvent,
    sendEvent,
    getDeviceId,
};

// true时仅打印log， false发送bi
let onlyLoggingNotSend = false;


/**
 * 专门发送编辑器"使用功能"事件的接口，指定的功能名作为事件属性。player中无效
 * @param funcName 功能名
 * @param eventInfoMap 可选属性
 * @constructor
 */
function sendEditorUseFunctionEvent(funcName, eventInfoMap = null) {
    if (!funcName) {
        console.error("invalid funcName");
        return;
    }
    if (eventInfoMap == null)
        eventInfoMap = {};
    eventInfoMap["funcName"] = funcName;
    sendEvent("UseFunction", eventInfoMap);
}


/**
 * 通用打点接口
 * @param eventName 事件名
 * @param eventInfoMap 可选事件属性
 * @constructor
 */
function sendEvent(eventName, eventInfoMap) {
    let list = [];
    if (eventInfoMap) {
        list.push(eventInfoMap);
    }
    sendGroupEvents([eventName], list);
}

/**
 * 发送一组BI数据
 * @param eventNames 事件名列表
 * @param eventInfoMapList 事件信息列表
 */
function sendGroupEvents(eventNames, eventInfoMapList) {
    if (!eventInfoMapList && eventInfoMapList.length !== eventNames.length)
        console.error("bi events and info not the same count, some will be ignored");

    let packets = [];
    for (let i = 0; i < eventNames.length; i++) {
        let packetData = getCommonData();
        packetData["event"] = eventNames[i];
        // 只有eventInfo内容是自定义的，其他是必须的
        let eventInfoMap = eventInfoMapList[i];
        if (eventInfoMap == null)
            eventInfoMap = {};
        eventInfoMap["_ProjectName"] = findProjectName();   // 内置区分项目名的属性
        eventInfoMap["_VersionCode"] = k_VersionCode;         // 加个整数版本号，方便过滤，看看能否生效
        packetData["eventinfo"] = eventInfoMap;
        packets.push(packetData);
    }
    let data = genBiMsgJson(packets);
    if (!Editor._buildCommand && !Editor._compileCommand) {
        // 命令行构建输出太多，这里跳过输出
        console.log(data);
    }
    if (!onlyLoggingNotSend) {
        let xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.addEventListener("readystatechange", function () {
            // 构建或者编译时跳过console打印resp
            if (!Editor._buildCommand && !Editor._compileCommand) {
                if (this.readyState === 4) {
                    console.log(this.responseText);
                }
            }
        });
        xhr.open("POST", "https://bi-tracker-cn.rivergame.net/event/tracker");
        xhr.setRequestHeader("Content-Type", "text/plain");
        xhr.send(data);
    }
}


/**
 * 生成BI数据json
 * @param  packets
 * @returns {string}
 * @constructor
 */
function genBiMsgJson(packets) {
    let jsonObj = {};
    // rid是每条消息的唯一标记
    jsonObj["rid"] = Date.now() + getDeviceId();
    jsonObj["v"] = "0.1.0";
    jsonObj["s"] = "client";
    jsonObj["rc"] = 0;
    jsonObj["app"] = "114";     // hardcoded engine group bi project app id string
    jsonObj["l"] = packets;    // 具体数据，可以多条合并发送
    return JSON.stringify(jsonObj);
}

let s_BIIndex = 0;

/**
 * 获取通用配置数据
 * @returns {{}}
 * @constructor
 */
function getCommonData() {
    s_BIIndex++;
    let currDate = Date.now();

    let commonData = {};
    commonData["temp_id"] = getDeviceId();  // 临时访客id
    commonData["platform"] = "CocosCreatorEditor";
    commonData["qn"] = s_BIIndex;
    commonData["time"] = currDate - startupTime;   // ms
    commonData["network_type"] = "wifi";
    commonData["debug"] = 0;
    commonData["uid"] = "";
    commonData["device_id"] = getDeviceId();    // 表示唯一用户
    commonData["sid"] = -1; // server id
    commonData["app_version"] = "1.0." + k_VersionCode;    // 同时修改上面的整数_VersionCode

    return commonData;
}


/**
 * 获取设备id
 * @returns {string}
 */
function getDeviceId() {
    if(!machineIdStr){
        machineIdStr = machineIdSync(true);
    }
    return machineIdStr;
}

/**
 * 查找工程名
 * @returns {string}
 */
function findProjectName() {
    // 工程名固定为topwar
    return "topwar-client";
}