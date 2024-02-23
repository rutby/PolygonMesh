/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

const FileUtil = require('./utils/file-util');
const Fs = require('fs');
const Path = require('path');

// 所有要搜索的目录，相对于assets目录(Editor.assetdb)
const ALL_SEARCH_PATH = ['resources', 'resourcs_art', 'Scene'];

module.exports = {
	load() {
	},

	unload() {
	},

	/**
   * 查找引用
   * @param {string[]} uuids
   * @returns {object[]}
   */
	findReferences(uuids) {
		let filter = '(' + uuids.join('|') + ')';
		let regExp = new RegExp(filter, 'g');

		const results = {};
		/**
		 * 文件处理函数
		 * @param {string} filePath 文件路径
		 * @param {Fs.Stats} stats 
		 */
		const searchHandler = (filePath, stats) => {
			const extname = Path.extname(filePath);
			// 场景和预制体资源
			if (extname === '.fire' || extname === '.prefab' || extname == '.anim' || extname == '.fnt' || extname == '.mtl') {
				const data = Fs.readFileSync(filePath).toString();
				let ret = data.match(regExp);
				if (ret) {
					filePath = Editor.assetdb.fspathToUrl(filePath);
					filePath = filePath.replace('db://', '');
					for (let uid of ret) {
						if (!results[uid]) {
							results[uid] = [filePath];
						} else {
							results[uid].push(filePath);
						}	
					}
				}
			}
		};
		// 遍历资源目录下的文件
		for (let subPath of ALL_SEARCH_PATH) {
			let assetsPath = Editor.url(`db://assets/${subPath}`);
			FileUtil.map(assetsPath, searchHandler);
		}

		// Done
		return results;
	},

	messages: {
		"print"() {
			Editor.Panel.open('print-res-used');
		},

		"panelPrint"(sender, filter) {
			let nodes = Editor.Selection.curSelection("node");
			let curSelectNode = nodes[0];
			Editor.Scene.callSceneScript("print-res-used", "printNodeRes", curSelectNode, (err, uuids, root, total, spf, spfnull) => {
				if (err) {
					Editor.error(err);
					return;
				}
				try {
					Editor.warn('开始打印资源路径');
					let begin = Date.now();
					let text = '';
					let pcount = 0;
					let realUUids = [];
					for(let item of uuids) {
						realUUids.push(item.uuid);
					}
					// 查找所有引用该资源的节点
					let references = this.findReferences(realUUids);

					for (let item of uuids) {
						let path = Editor.assetdb.uuidToUrl(item.uuid);
						path = path.replace('db://', '');
						if (filter && path.indexOf(filter) >= 0) {
							continue;
						}
						pcount += 1;
						text += `当前节点: ${item.node}\n该节点引用资源路径: ${path}\n该资源被引用明细:\n`;
						for (let p of references[item.uuid]) {
							text += p;
							text += '\n';
						}
						text += '--------------------\n';
					}
					if (sender.reply) {
						sender.reply(null, text, root, total, spf, spfnull, pcount);
					}
					Editor.warn('结束打印资源路径, 耗时:', Date.now() - begin);
				} catch (e) {
					Editor.error(e);
				}
			}, 1000);
		}
	}
};