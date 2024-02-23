/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const trace = Editor.log;
function traverAllNode(root, list) {
	let illegalCharacter = /([^\u0020-\u0080]|[a-zA-Z0-9])+/;
	if (root.getComponent(cc.Label) && illegalCharacter.test(root.getComponent(cc.Label).string)) {
		list.push(root);
	} else if (root.getComponent(cc.RichText) && illegalCharacter.test(root.getComponent(cc.RichText).string)) {
		list.push(root);
	}

	let validFonts = ["Arial", "MicrosoftYaHei"];
	if (root.getComponent(cc.Label) && root.getComponent(cc.Label).useSystemFont && (validFonts.indexOf(root.getComponent(cc.Label).fontFamily) < 0)) {
		root.getComponent(cc.Label).fontFamily = "Arial";
		trace(root.name + "使用了非法font, 已经替换为了Arial, 请手动保存文件");
	}

	for (let i = 0; i < root.childrenCount; ++i) {
		traverAllNode(root.children[i], list);
	}
}

function deleteAllStringValues(stringList, refSet) {
	for (let i = 0; i < stringList.length; ++i) {
		let curNode = stringList[i];
		if (curNode.getComponent("LocalComponent")) {
			if (curNode.getComponent(cc.Label)) {
				curNode.getComponent(cc.Label).string = "";
			}

			if (curNode.getComponent(cc.RichText)) {
				curNode.getComponent(cc.RichText).string = "";
			}
			
		} else if (curNode.getComponent(cc.Label) || curNode.getComponent(cc.RichText)) {
			if (refSet.has(curNode.uuid)) {
				if (curNode.getComponent(cc.Label)) {
					curNode.getComponent(cc.Label).string = "";
				}
	
				if (curNode.getComponent(cc.RichText)) {
					curNode.getComponent(cc.RichText).string = "";
				}
				trace(curNode.name + "被脚本引用,默认删除,请自行检查删除是否正确");
			} else {
				trace(curNode.name + "有非法字符,但是没有对应的本地化组件, 也没有被脚本引用,请人工确认是否删除");
			}
		}
	}	
}

function getCompPropertySet(scene) {
	let ret = new Set();
	if (scene) {
		let comps = scene.getComponentsInChildren(cc.Component);
		for (let i = 0; i < comps.length; ++i) {
			let pKeys = Object.keys(comps[i]);
			for (let j = 0; j < pKeys.length; ++j) {
				if (comps[i][pKeys[j]] instanceof cc.Label) {
					ret.add(comps[i][pKeys[j]].node.uuid);
				}

				if (comps[i][pKeys[j]] instanceof cc.RichText) {
					ret.add(comps[i][pKeys[j]].node.uuid);
				}

				if (comps[i][pKeys[j]] instanceof cc.Node) {
					if (comps[i][pKeys[j]].getComponent(cc.Label) || comps[i][pKeys[j]].getComponent(cc.RichText)) {
						ret.add(comps[i][pKeys[j]].uuid);
					}
				}
			}
		}
	}
	return ret;
}

module.exports = {
	'eraseStringsJob': function (sender) {
		START_ERASE = confirm("是否要执行非法字符清理?\n执行意味着当前prefab下全部符合下列条件的文本都会被删除\n1.包含LocalComponent脚本\n2.被脚本引用\n\n运行完后请记得手动保存当前文件");
		if (!START_ERASE) return;

		let scene = cc.director.getScene();
		
		let allNodes = [];
		traverAllNode(scene, allNodes);
		let uuidSet = getCompPropertySet(scene);
		if (allNodes.length > 0)
			deleteAllStringValues(allNodes, uuidSet);
	}
};