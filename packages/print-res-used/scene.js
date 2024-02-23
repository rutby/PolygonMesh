/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

let count = 0;	// 遍历的总节点数量
let spCount = 0;  // 引用资源的节点数量
let spNullCount = 0;  // 有sprite组件但没有引用资源的节点数量
let spUids = [];  // 引用资源的节点路径和资源的uuid

function getPath(node) {
	let path = [];
	while(node) {
		path.unshift(node.name);
		node = node.parent;
	}
	return path.join('/');
}

function recursiveNode(node) {
	if (node) {
		count++;
		if (node.childrenCount > 0) {
			for (let child of node.children) {
				recursiveNode(child);
			}
		} else {
			let sp = node.getComponent(cc.Sprite);
			if (sp && sp.spriteFrame) {
				spCount++;
				let path = getPath(node);
				spUids.push({node: path, uuid: sp.spriteFrame._uuid});
			} else {
				spNullCount ++;
			}
		}
	}
}

module.exports = {
	'printNodeRes': function (event, param) {
		if (!event.reply) return;
		param = param ? param : "";
		let node = cc.engine.getInstanceById(param);
		Editor.warn("当前选中的节点:", node ? node.name : null);

		count = 0;
		spCount = 0;
		spNullCount = 0;
		spUids = [];
		recursiveNode(node);
		// Editor.warn(`总节点数量:${count}, 引用资源的节点数量:${spCount}, 空sprite节点数量:${spNullCount}`);
		event.reply(null, spUids, node.name, count, spCount, spNullCount);
	}
};