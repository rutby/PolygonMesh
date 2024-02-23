var workerCache = {};
(() => {
  "use strict";
  0;
  const e = require("electron").ipcRenderer;
  var t, r, i, n, o, a;
  const s = "none",
    l = "default",
    d = "merge_all_json";
  (window.onerror = function(e, t, r, i, n) {
    window.onerror = null;
    var o = n.stack || n;
    Editor &&
      Editor.Ipc &&
      Editor.Ipc.sendToMain &&
      (
        Editor.Ipc.sendToMain("app:build-project-abort", o),
        Editor.Ipc.sendToMain("metrics:track-exception", o)
      );
  }), window.addEventListener("unhandledrejection", function e(t) {
    window.removeEventListener(
      "unhandledrejection",
      e
    ), window.onerror(void 0, void 0, void 0, void 0, t.reason);
  }), e.on("app:init-build-worker", function(e, s, l) {
    workerCache = {};
    (t = require("path")), (r = require("fire-fs")), require("gulp"), require("event-stream"), (i = require("async")), (n = require("lodash")), (o = require(Editor.url("app://editor/share/build-platforms"))), (Editor.isBuilder = !0), (window.CC_TEST = !1), (window.CC_EDITOR = !0), (window.CC_PREVIEW = !1), (window.CC_DEV = !1), (window.CC_DEBUG = !0), (window.CC_BUILD = !1), (window.CC_JSB = !1), Editor.require("app://editor/share/editor-utils"), Editor.require("unpack://engine-dev"), Editor.require("app://editor/share/engine-extends/init"), Editor.require("app://editor/share/engine-extends/serialize"), Editor.require("app://editor/page/asset-db"), Editor.require("app://editor/share/register-builtin-assets");
    const d = require(Editor.url("app://editor/page/project-scripts"));
    a = Editor.remote.importPath.replace(/\\/g, "/");
    var c = Editor.remote.Builder.actualPlatform2Platform(s),
      u = !o[c].exportSimpleProject;
    i.waterfall(
      [
        function(e) {
          cc.assetManager.init({
            importBase: a,
            nativeBase: a
          }), (cc.assetManager.cacheAsset = !1), (cc.assetManager.force = !0), (cc.assetManager.downloader.maxRetryCount = 0), (cc.assetManager.downloader.limited = !1), (cc.assetManager.downloader.appendTimeStamp = !0);
          var t = document.createElement("canvas");
          document.body.appendChild(t), (t.id = "engine-canvas"), cc.game.run(
            {
              width: 800,
              height: 600,
              id: "engine-canvas",
              debugMode: cc.debug.DebugMode.INFO
            },
            e
          );
        },
        Editor.Utils.asyncif(u, d.load.bind(d))
      ],
      t => {
        e.reply(t || null);
      }
    );
  }), e.on("app:build-assets", function(
    e,
    { dest: c, root: u, scenes: p },
    f,
    m,
    g
  ) {
    var w,
      E,
      h = 4,
      b = Editor.remote.Builder.actualPlatform2Platform(f),
      y = o[b],
      q = g.hasOwnProperty("pack") ? g.pack : y.pack,
      k = t.join(c, "import"),
      v = require(Editor.url("app://editor/page/build/file-writer")),
      x = require(Editor.url("app://editor/page/build/asset-crawler")),
      C = require(Editor.url("app://editor/page/build/build-asset")),
      T = require(Editor.url("app://editor/page/build/group-manager")),
      U = require(Editor.url("app://editor/page/build/group-strategies")),
      P = require("./texture-packer"),
      j = require(Editor.url("app://editor/page/build/building-assetdb")),
      S = new v(k, m),
      _ = new j(Editor.assetdb),
      A = new P();
    if (g.compressionType === l) {
      if (y.isNative) {
        if (g.optimizeHotUpdate) g.inlineSpriteFrames = !1;
        else {
          g.inlineSpriteFrames &&
            Editor.info(
              'Enable "%s" in native platform will increase the package size used in hot update.',
              Editor.T("BUILDER.merge_asset.inline_SpriteFrames")
            );
        }
        q = q && (g.optimizeHotUpdate || g.inlineSpriteFrames);
      }
    } else
      g.compressionType === s
        ? (q = !1)
        : g.compressionType === d
          ? ((g.mergeAllJson = !0), (g.inlineSpriteFrames = !1))
          : (g.inlineSpriteFrames = !1);
    q &&
      (
        (E =
          g.compressionType === d
            ? new U.MergeAllJson()
            : y.isNative
              ? g.optimizeHotUpdate
                ? new U.ForHotUpdate()
                : new U.GroupStrategyBase()
              : new U.SizeMinimized()),
        console.log("group strategy:", cc.js.getClassName(E)),
        (w = new T(S, m, E, _, n.pick(g, "inlineSpriteFrames", "mergeAllJson")))
      );
    var F,
      M,
      I,
      B,
      R = new C(S, a, _, f, g.sharedUuid),
      z = new x(R, h, A);
    var D = [
      e => {
        Editor.log("queryResources start " + new Date().toString());
        console.time("queryResources"), e(null);
      },
      function(e) {
        u
          ? Editor.assetdb.queryAssets(`${u}/**/*`, null, function(t, i) {
              if ("db://internal/resources" === u) {
                const e = Editor.url("unpack://engine/modules.json");
                let t = [];
                try {
                  let i = r.readJsonSync(e);
                  const n =
                    Editor.Profile
                      .load("project://project.json")
                      .get("excluded-modules") || [];
                  n.length > 0 &&
                    i.forEach(e => {
                      let r = e["internal/resources"];
                      n.includes(e.name) && r && (t = t.concat(r));
                    });
                } catch (e) {
                  Editor.warn(e);
                }
                if (
                  (
                    console.log("excluded assets：" + JSON.stringify(t)),
                    t.length > 0
                  )
                ) {
                  const e = require("fire-url");
                  i = i.filter(r => {
                    let i = e.basenameNoExt(r.url);
                    return !t.includes(i);
                  });
                }
              }
              e(t, i);
            })
          : e(null, []);
      },
      (e, t) => {
        Editor.log("queryResources end " + new Date().toString());
        console.timeEnd("queryResources"), console.time("startAssetCrawler"), t(
          null,
          e
        );
      },
      function(e, t) {
        var r = e
            .filter(
              e =>
                "folder" !== e.type &&
                "javascript" !== e.type &&
                "typescript" !== e.type
            )
            .map(e => e.uuid),
          i = p;
        (F = n.uniq(i.concat(r))), z.start(F, t);
      },
      (e, t) => {
        Editor.log("startAssetCrawler end " + new Date().toString());
        console.timeEnd("startAssetCrawler"), t(null, e);
      },
      function(e, t) {
        (M = e), t(null);
      }
    ];
    1, (D = [].concat(
      function(e) {
        Editor.log("query asset start " + new Date().toString());
        Editor.assetdb.queryAssets("db://**/*.pac", "auto-atlas", e);
      },
      function(e, t) {
        Editor.log("init packer start " + new Date().toString());
        A.init({
          root: u,
          files: e,
          writer: S,
          actualPlatform: f,
          caches: workerCache
        })
          .then(t)
          .catch(t);
      },
      D,
      function(e) {
        Editor.log("pack textures start " + new Date().toString());
        console.time("pack textures"), A.pack(M)
          .then(t => {
            let {
                unpackedTextures: r,
                packedSpriteFrames: i,
                packedTextures: o
              } = t,
              a = r.map(e => e.textureUuid),
              s = n.pullAll(A.textureUuids, a);
            B = t.pacInfos;
            for (let e in i) M[e] = { dependUuids: [i[e]] };
            for (let e in o) {
              let t = o[e];
              (M[e] = {
                nativePath: t[0],
                nativePaths: t
              }), _.addGeneratedAsset(e, t[0], "texture", !1);
            }
            let l = [],
              d = A.texture2pac;
            if (s.length > 0)
              for (let e in M) {
                let t = M[e];
                if ("object" != typeof t) continue;
                let r = t.dependUuids;
                if (r)
                  for (let t = 0, i = r.length; t < i; t++) {
                    let i = r[t];
                    if (-1 !== s.indexOf(i) && -1 === l.indexOf(i)) {
                      l.push(i);
                      let t = Editor.assetdb.remote.uuidToUrl(i),
                        r = d[i].relativePath,
                        n = Editor.assetdb.remote.uuidToUrl(e);
                      Editor.warn(
                        Editor.T("BUILDER.error.keep_raw_texture_of_atlas", {
                          texturePath: t,
                          pacPath: r,
                          assetPath: n
                        })
                      );
                    }
                  }
              }
            if ((n.pullAll(F, A.textureUuids), r.length > 0 || l.length > 0)) {
              let t = r
                .map(e => {
                  let t = Editor.assetdb.remote.uuidToUrl(e.textureUuid);
                  return Editor.warn(
                    `${t} has not been packed into AutoAtlas.`
                  ), e.uuid;
                })
                .concat(l);
              new x(R, h).start(t, (t, r) => {
                if (t) return e(t);
                Object.assign(M, r), e();
              }), (F = n.uniq(F.concat(t)));
            } else e();
            Editor.log("pack textures end " + new Date().toString());
            console.timeEnd("pack textures");
          })
          .catch(t => e(t));
      }
    )), q &&
      D.push(
        function(e) {
          Editor.log("init packs start " + new Date().toString());
          console.time("init packs"), w.initPacks(F, M, e);
        },
        function(e) {
          Editor.log("init packs end " + new Date().toString());
          console.timeEnd("init packs"), console.time(
            "build packs"
          ), w.buildPacks(e);
        },
        function(e, t) {
          Editor.log("build packs end " + new Date().toString());
          console.timeEnd("build packs"), (I = e.packedAssets), t();
        }
      ), D.push(function(e) {
      S.flush(e);
    }), i.waterfall(D, function(t) {
      if (t)
        (t = t && t.stack) instanceof Error || (t = new Error(t)), e.reply(t);
      else {
        console.log("finished build-worker"), F.forEach(e => {
          var t = M[e];
          "object" != typeof t ? (M[e] = { isRoot: !0 }) : (t.isRoot = !0);
        });
        B &&
          B.length > 0 &&
          (B = B.map(e => (delete e.spriteFrames, e))), e.reply(null, M, I, B);
      }
    });
  });
  const c = Editor.require("app://editor/share/3d-physics-build-utils");
  e.on("app:build-physics", async function(e, t) {
    await c.build(t), e && e.reply();
  });
  const u = require(Editor.url("unpack://engine/gulp/tasks/engine"));
  e.on("app:build-cocos2d", function(e, t) {
    const {
      func: r,
      sourceFile: i,
      outputFile: n,
      excludes: o,
      opt_macroFlags: a,
      sourceMaps: s
    } = t;
    Editor.Ipc.sendToAll(
      "builder:state-changed",
      "building engine",
      0.25
    ), u[r](i, n, o, a, e.reply, s);
  });
})();
