// 用于编辑器内控制优化选项的各项开关
// TODO 读取profile配置，写入profile配置

/**
 * 开启面板
 */
function showSwitchPanel() {
    Editor.Panel.open('engine-switch');
}

/**
 * 获取当前开关状态返回给面板
 * @returns {Object}
 */
function refreshAllSwitch() {
    if (!global.funcCost) {
        return {};
    }
    let funcCost = global.funcCost;

    let table = funcCost.getOptimizeTable();

    let keyList = Object.keys(table);

    let returnList = [];
    for (let index in keyList) {
        let name = keyList[index];
        let state = table[name];
        returnList.push({
            name: name,
            state: state.turnOn,
            desc: state.description,
        });
    }
    // 获取优化版本信息
    let version = 'v0.0.0';
    if (funcCost.getVersion) {
        version = funcCost.getVersion();
    }

    // 获取设备bi的id
    let machineId = 'unknown machineId';
    try {
        let biTool = Editor.require('packages://engine-performance/bi-tool.js');
        if (biTool) {
            machineId = biTool.getDeviceId();
        }
    } catch (e) {
    }
    console.log(table);
    return {returnList: returnList, version: version, machineId: machineId};
}

/**
 * 修改优化选项的开关状态
 * @param switchData
 */
function setSwitch(switchData) {
    if (!funcCost) {
        return;
    }
    let name = switchData.name;
    let optimizeTable = funcCost.getOptimizeTable();
    let value = optimizeTable[name].turnOn;
    funcCost.switchOptimize(name, !value);
}

module.exports = {
    load() {
    },
    unload() {
    },
    messages: {
        'engine-switch:show-switch-panel': function () {
            showSwitchPanel();
        },
        'engine-switch:refresh-switch': function (event) {
            let returnInfo = refreshAllSwitch();
            if (event.reply) {
                event.reply(null, returnInfo);
            }
        },
        'engine-switch:set-switch': function (event, switchData) {
            setSwitch(switchData);
            let returnInfo = refreshAllSwitch();
            if (event.reply) {
                event.reply(null, returnInfo);
            }
        }
    }
};