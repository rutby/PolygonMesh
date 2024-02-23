'use strict';
var lastHeadRef = null;
var fsWatcher = null;
var originalUpdateMTimeFunc;
var originalMetaSave;
module.exports = {
  load() {
    // 当 package 被正确加载的时候执行
    let fs = require("fs");
    let ignoreFile = Editor.Project.path + "/.ignoreWatchGit";
    if (fs.existsSync(ignoreFile)) {
      return;
    }
    let headFilePath = Editor.Project.path + "/../.git/HEAD";

    if (!fs.existsSync(headFilePath)) {
      return;
    }
    lastHeadRef = fs.readFileSync(headFilePath, { encoding: "utf8" });
    let chokidar = Editor.require("chokidar");
    fsWatcher = chokidar.watch(headFilePath, {
      persistent: true
    });
    fsWatcher.on("change", this.onHeadRefChanged);
    // let meta = Editor.require("app://asset-db/lib/meta");
    // originalMetaSave = meta.save;
    // meta.save = function(r, a, n) {
    //   Editor.log("save meta " + a);
    //   originalMetaSave.call(this, r, a, n);
    // };
    // originalUpdateMTimeFunc = Editor.assetdb.updateMtime;
    // Editor.assetdb.updateMtime = function(t) {
    //   try {
    //     if (!this.isSubAssetByUuid(t)) {
    //       if (t) {
    // 		  let e = this._uuid2path[t];
    //     if (this._uuid2mtime[t]) {
    //       Editor.log(e + " mtime changed original asset mtime " + this._uuid2mtime[t].asset + " ori meta mtime " + this._uuid2mtime[t].meta + " cur asset mtime " + fs
    //             .statSync(e)
    //             .mtime.getTime() + "  cur meta mtime " + fs
    //             .statSync(e + ".meta")
    //             .mtime.getTime());
    //     }
    //       }
    //     }
    //   } catch (e) {
    //     Editor.log(e);
    //   }

    //   try {
    //     originalUpdateMTimeFunc.call(this, t);
    //   } catch (e) {
    //     Editor.log(e);
    //   }
    // };
  },

  onHeadRefChanged(path) {
    let fs = require("fs");
    let headFilePath = Editor.Project.path + "/../.git/HEAD";
    if (!fs.existsSync(headFilePath)) {
      return;
    }
    let curHeadRef = fs.readFileSync(headFilePath, { encoding: "utf8" });
    if (curHeadRef !== lastHeadRef) {
      process.exit();
    }
  },

  unload() {
    // let meta = Editor.require("app://asset-db/lib/meta");
    // meta.save = originalMetaSave;
    // Editor.assetdb.updateMtime = originalUpdateMTimeFunc;
    if (fsWatcher) {
      fsWatcher.close();
      fsWatcher = null;
    }
    // 当 package 被正确卸载的时候执行
  },

  messages: {}
};