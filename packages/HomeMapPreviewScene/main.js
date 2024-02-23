/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use strict';

const fs = require("fs");
const path = require("path");
const trace = Editor.log;

function loadAreaV3() {
	let filePath = path.join(Editor.Project.path, "../Tools/exportTools/client/json/area_v3.json");
	let fileData = fs.readFileSync(filePath, { encoding: "utf8" });

	// trace(filePath);
	// trace(fileData);

	return JSON.parse(fileData);
}


function buildNodes() {
	let tableData = loadAreaV3();
	trace("buildNodes");
	Editor.Scene.callSceneScript("homemap-preview-scene", "buildAreas", tableData);
}



module.exports = {
	load() {
		trace(`load`);
	},

	unload() {

		trace(`unload`);
	},

	messages: {
		"start"() {
			trace(`start`);
			buildNodes();
		}
	}
};