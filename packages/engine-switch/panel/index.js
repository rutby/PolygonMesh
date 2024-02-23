/**
 * 刷新当前状态
 * @param uiElements
 */
function refreshState(uiElements) {
    Editor.Ipc.sendToMain('engine-switch:refresh-switch', function (error, returnInfo) {
        let version = uiElements.$version;
        let switchStateList = uiElements.$switchStateList;
        let machineId = uiElements.$machineId;

        let switchList = returnInfo.returnList;
        let versionStr = returnInfo.version;
        let machineIdStr = returnInfo.machineId;

        version.innerHTML = versionStr;
        machineId.innerHTML = machineIdStr;

        let insertState = '';
        let length = switchList.length;
        for (let switchState of switchList) {
            let name = switchState.name;
            let state = switchState.state;
            let desc = switchState.desc;

            let buttonHtml;
            if (state) {
                buttonHtml = '<button style="background-color:darkgreen">已启用</button>';
            } else {
                buttonHtml = '<button style="background-color:darkred">已禁用</button>';
            }
            insertState += `<li>开关 ${name} 开启状态${state} ${buttonHtml} <h3>>>${desc}<<</h3></li>\n`;
        }
        switchStateList.innerHTML = insertState;
        for (let index = 0; index < length; index++) {
            let child = switchStateList.children[index];
            let name = switchList[index].name;
            child.querySelector("button").addEventListener("click", function () {
                Editor.Ipc.sendToMain('engine-switch:set-switch', {name: name}, function (error) {
                    refreshState(uiElements);
                });
            });
        }
    });
}

// panel/index.js
Editor.Panel.extend({
    style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
    h3 { color: green}
    blue { color: blur}
    red { color: red}
    nav ul{position:absolute; top:200px; min-height:300px;bottom:10px;max-height:auto; }
    nav ul{ overflow:hidden; overflow-y:scroll;}
  `,
    template: `
    <h2>优化选项</h2>
    <h2 id='version'>版本</h2>
    <h2 id='machineId'>机器id</h2>
    
    <ui-button id="btn">刷新</ui-button>
    <hr />
    <nav>
    <ul class="list" id="switchStateList"></ul>
    </nav>
  `,

    $: {
        btn: '#btn',
        switchStateList: '#switchStateList',
        version: '#version',
        machineId: '#machineId',
    },

    ready() {
        console.log("ready");
        let uiElements = this;
        refreshState(uiElements);

        this.$btn.addEventListener('confirm', () => {
            refreshState(uiElements);
        });
    },
});