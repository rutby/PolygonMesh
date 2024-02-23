/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

const trace = Editor.log;
module.exports = {
	load() {
	},

	unload() {
	},

	messages: {
		'start' () {
			Editor.Scene.callSceneScript("string-eraser", "eraseStringsJob");
		}
	}
};