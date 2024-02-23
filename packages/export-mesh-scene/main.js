/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-undef */
'use strict';

module.exports = {
  load () {
  },
  unload () {
  },
  // register your ipc messages here
  messages: {
    'start' () {
      Editor.Scene.callSceneScript("export-mesh-scene", "exportMeshSceneJob");
      // Editor.log("hello,world")
    }
  }
};