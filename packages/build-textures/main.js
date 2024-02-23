/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const fs = require("fs");
const path = require("path");
const trace = Editor.log;

var buildAssetsInfo = {};
buildAssetsInfo.bundles = null;
buildAssetsInfo.spriteFrames = null;
buildAssetsInfo.textures = null;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,max-lines-per-function
function onBeforeBuildFinish(options, callback) {
  let bundles = options.bundles;
  buildAssetsInfo.bundles = bundles;
  buildAssetsInfo.spriteFrames = null;
  buildAssetsInfo.textures = null;
  let platform = options.platform;
  Editor.log("build platform " + platform);
  // get path of textures auto generated by auto atlas
  let hardcoreUuids = [];
  if (platform === "ios" || platform === "android") {
    let pathProcess = path;
    function walkFile(path, results, ext) {
      var dirList = fs.readdirSync(path);

      dirList.forEach(function (item) {
        let filePath = path + pathProcess.sep + item;
        let fileExt = pathProcess.extname(filePath);
        let fileStat = fs.statSync(filePath);
        if (fileStat.isFile()) {
          fileExt === ext && results.push(filePath);
        } else if (fileStat.isDirectory()) {
          walkFile(filePath, results, ext);
        }
      });
    }
    let heroSpineFiles = [];
    let replacePrefix = Editor.Project.path + path.sep;
    walkFile(
      Editor.Project.path + path.sep + "assets/resources_art/hero_bust",
      heroSpineFiles,
      ".png"
    );
    heroSpineFiles.forEach(function (item) {
      hardcoreUuids.push("db://" + item.replace(replacePrefix, ""));
    });

    let otherSpineFiles = [];
    walkFile(
      Editor.Project.path + path.sep + "assets/resources_art/effect/spine",
      otherSpineFiles,
      ".png"
    );
    let armySpineFiles = [];
    walkFile(
      Editor.Project.path + path.sep + "assets/resources_art/army_spine",
      armySpineFiles,
      ".png"
    );
    armySpineFiles.forEach(function (item) {
      hardcoreUuids.push("db://" + item.replace(replacePrefix, ""));
    });

    
    otherSpineFiles.forEach(function (item) {
      hardcoreUuids.push("db://" + item.replace(replacePrefix, ""));
    });

    hardcoreUuids.push(
      "db://assets/resources_art/homeland/textures/ground1.png"
    );
    hardcoreUuids.push(
      "db://assets/resources_art/homeland/textures/water7b.png"
    );
    hardcoreUuids.push("db://assets/resources_art/homeland/textures/foam.jpg");
    hardcoreUuids.push(
      "db://assets/resources_art/homeland/textures/ground_desert.png"
    );
    hardcoreUuids.push(
      "db://assets/resources_art/homeland/textures/dibiao_1.png"
    );
    hardcoreUuids.push(
      "db://assets/resources_art/homeland/textures/dibiao_2.png"
    );
    hardcoreUuids.push(
      "db://assets/resources_art/homeland/textures/dibiao_3.png"
    );
    hardcoreUuids.push(
      "db://assets/resources_art/homeland/textures/dibiao_4.png"
    );
    hardcoreUuids.push(
      "db://assets/resources_art/homeland/models/Normal/PackedUV_Normal.png"
    );
    hardcoreUuids.push(
      "db://assets/resources_art/homeland/models/Arabic/PackedUV_AR.png"
    );
  }
  Editor.assetdb.queryAssets(
    "db://assets/**/*",
    "sprite-frame",
    // eslint-disable-next-line max-lines-per-function
    (err, assetInfos) => {
      //Editor.log(`sprite-frames: ${JSON.stringify(assetInfos,null,2)} `);
      // buildAssetsInfo.spriteFrames = assetInfos;
      // checkResData(callback);
      // let textures = _getTextureFromSpriteFrames(buildResults, assetInfos);
      // for (let i = 0; i < textures.length; ++i) {
      //     let path = buildResults.getNativeAssetPath(textures[i]);
      //    // Editor.log(`"resources/AutoAtlas": ${path} originpath ${textures[i]}`);
      // }
      let containMap = new Map();
      bundles.forEach((bundle) => {
        let buildResults = bundle.buildResults;
        for (let spf of assetInfos) {
          // Editor.log("query sp-frame " + Editor.assetdb.uuidToFspath(spf.uuid));
          if (!buildResults.containsAsset(spf.uuid)) {
            continue;
          }
          let depends = buildResults.getDependencies(spf.uuid);
          depends.forEach((element) => {
            if (!containMap.has(element)) {
              containMap.set(element, { br: buildResults, uuid: [spf.uuid] });
            } else {
              containMap.get(element).uuid.push(spf.uuid);
            }
          });
        }
      });

      const fs = require("fs");
      const pathProcess = require("path");
      let spFrameJsonMap = {};
      let projectPathPrefix = Editor.Project.path + pathProcess.sep;
      let projectAssetsPath = Editor.Project.path + pathProcess.sep + "assets";
      for (var [key, value] of containMap) {
        let containAssets = value.uuid;
        let buildResults = value.br;
        if (containAssets.length > 1) {
          let originalPath = Editor.assetdb.uuidToFspath(containAssets[0]);
          let wrapperPath = pathProcess.dirname(originalPath);
          if (!wrapperPath.endsWith(".plist")) {
            let pacFile = null;
            // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            // eslint-disable-next-line require-jsdoc
            function walkPacFile(path) {
              var dirList = fs.readdirSync(path);

              dirList.forEach(function (item) {
                let filePath = path + pathProcess.sep + item;
                let fileExt = pathProcess.extname(filePath);
                if (fs.statSync(filePath).isFile() && fileExt === ".pac") {
                  pacFile = filePath;
                  return;
                }
              });
            }
            while (
              !pacFile &&
              wrapperPath !== "/" &&
              wrapperPath !== projectAssetsPath
            ) {
              wrapperPath = pathProcess.dirname(wrapperPath);
              // Editor.log("originalPath " + originalPath);
              // Editor.log("autoAtlasDirPath " + autoAtlasDirPath);

              walkPacFile(wrapperPath);
            }
            if (pacFile) {
              let finalKey = pacFile.replace(projectPathPrefix, "");
              if (!spFrameJsonMap[finalKey]) {
                spFrameJsonMap[finalKey] = [
                  buildResults
                    .getNativeAssetPath(key)
                    .replace(projectPathPrefix, ""),
                ];
              } else {
                spFrameJsonMap[finalKey].push(
                  buildResults
                    .getNativeAssetPath(key)
                    .replace(projectPathPrefix, "")
                );
              }
            }
          } else {
            let plistRaw = fs.readFileSync(wrapperPath);
            let plist = require("plist");
            let plistVal = plist.parse(plistRaw.toString());
            if (plistVal["metadata"]) {
              let plistTexName =
                plistVal["metadata"]["realTextureFileName"] ||
                plistVal["metadata"]["textureFileName"];
              if (plistTexName) {
                let plistBaseName = pathProcess.basename(wrapperPath);
                wrapperPath = wrapperPath.replace(plistBaseName, plistTexName);
              }
            }
            let finalKey = wrapperPath.replace(projectPathPrefix, "");
            if (!spFrameJsonMap[finalKey]) {
              spFrameJsonMap[finalKey] = [
                buildResults
                  .getNativeAssetPath(key)
                  .replace(projectPathPrefix, ""),
              ];
            } else {
              spFrameJsonMap[finalKey].push(
                buildResults
                  .getNativeAssetPath(key)
                  .replace(projectPathPrefix, "")
              );
            }
          }
        } else if (containAssets.length === 1) {
          spFrameJsonMap[
            pathProcess
              .dirname(Editor.assetdb.uuidToFspath(containAssets[0]))
              .replace(projectPathPrefix, "")
          ] = [
            buildResults.getNativeAssetPath(key).replace(projectPathPrefix, ""),
          ];
          // Editor.log("build path " + () + " original path " + ());
        }
      }

      for (let url of hardcoreUuids) {
        let fspath = Editor.assetdb.urlToFspath(url);
        if (!fspath) {
          continue;
        }
        //  Editor.log("url: " + url + " fspath: " + fspath);
        let uuid = Editor.assetdb.urlToUuid(url);
        uuid &&
          (spFrameJsonMap[fspath.replace(projectPathPrefix, "")] = [
            path
              .join(
                options.dest,
                "remote",
                "resources",
                "native",
                uuid.slice(0, 2),
                uuid + path.extname(fspath)
              )
              .replace(projectPathPrefix, ""),
          ]);
      }
      fs.writeFileSync(
        projectPathPrefix + "spriteFrameMap.json",
        JSON.stringify(spFrameJsonMap, null, 2)
      );
      callback();
    }
  );

  // get texture path of plist atlas
  // Editor.assetdb.queryAssets('db://assets/resources/atlas.png', 'texture', (err, assetInfos) => {
  //     for (let i = 0; i < assetInfos.length; ++i) {
  //         let tex = assetInfos[i].uuid;
  //         if (buildResults.containsAsset(tex)) {
  //             let path = buildResults.getNativeAssetPath(tex);
  //             // Editor.log(`Texture of "${assetInfos[i].url}": ${path}`);
  //         }
  //     }
  // });

  // get common texture path
  // Editor.assetdb.queryAssets('db://assets/resources/image/*', 'texture', (err, assetInfos) => {
  //    // Editor.log(`textures: ${JSON.stringify(assetInfos,null,2)} `);

  //     buildAssetsInfo.textures = {};

  //     for (let i = 0; i < assetInfos.length; ++i) {
  //         let tex = assetInfos[i].uuid;
  //         if (buildResults.containsAsset(tex)) {
  //             let path = buildResults.getNativeAssetPath(tex);
  //             buildAssetsInfo.textures[tex] = {
  //                 name:assetInfos[i].url.split("//")[1],
  //                 path:path
  //             };
  //            // Editor.log(`Texture of "${assetInfos[i].url}": ${path}`);
  //         }
  //     }

  //     checkResData(callback);

  // });

  // get all textures in build
  // let textures = [];
  // let assets = buildResults.getAssetUuids();
  // let textureType = cc.js._getClassId(cc.Texture2D);
  // for (let i = 0; i < assets.length; ++i) {
  //     let asset = assets[i];
  //     if (buildResults.getAssetType(asset) === textureType) {
  //         textures.push(buildResults.getNativeAssetPath(asset));
  //     }
  // }
  // Editor.log(`All textures in build: ${textures}`);
}

// function _getTextureFromSpriteFrames(buildResults, assetInfos) {
//   let textures = {};
//   for (let i = 0; i < assetInfos.length; ++i) {
//     let info = assetInfos[i];
//     if (buildResults.containsAsset(info.uuid)) {
//       let depends = buildResults.getDependencies(info.uuid);
//       if (depends.length > 0) {
//         // sprite frame should have only one texture
//         textures[depends[0]] = true;
//       }
//     }
//   }
//   return Object.keys(textures);
// }

// function checkResData(callback) {
//   if (!buildAssetsInfo.spriteFrames) {
//     return;
//   }
//   if (!buildAssetsInfo.textures) {
//     return;
//   }
//   trace(`buildAssetsInfo = ${JSON.stringify(buildAssetsInfo, null, 2)}`);
//   // 解析buildresuts
//   // 解析 dependUuids
//   let dependUuidsInfos = {};
//   let _buildAssets = buildAssetsInfo.buildResults["_buildAssets"];
//   for (let k in _buildAssets) {
//     let dependUuids = _buildAssets[k]["dependUuids"];
//     if (dependUuids) {
//       trace(`dependUuids = ${JSON.stringify(dependUuids, null, 2)}`);
//       for (let i = 0; i < dependUuids.length; i++) {
//         let uuid = dependUuids[i];
//         if (!dependUuidsInfos[uuid]) {
//           dependUuidsInfos[uuid] = [];
//         }
//         dependUuidsInfos[uuid].push(k);
//       }
//     }
//   }
//   // 剔除正常图片

//   let getSprieFrameInfo = function (uuid) {
//     for (let spf of buildAssetsInfo.spriteFrames) {
//       if (spf.uuid === uuid) {
//         return spf;
//       }
//     }
//     return null;
//   };
//   trace(`dependUuidsInfos = ${JSON.stringify(dependUuidsInfos, null, 2)}`);
//   for (let uuid in dependUuidsInfos) {
//     let hasDelete = false;
//     for (const texId in buildAssetsInfo.textures) {
//       if (texId === uuid) {
//         delete dependUuidsInfos[uuid];
//         hasDelete = true;
//         break;
//       }
//     }
//     if (hasDelete) {
//       continue;
//     }
//     let dependFrames = dependUuidsInfos[uuid];
//     let sameDirFile = [];
//     for (let index = 0; index < dependFrames.length; index++) {
//       let spf = getSprieFrameInfo(dependFrames[index]);
//       if (spf) {
//         sameDirFile.push(spf.url);
//       }
//     }
//     if (sameDirFile.length > 0) {
//       let imgFileName = "";
//       if (sameDirFile.length > 1) {
//         let endDir = "";
//         for (let i = 3; i < 256; i++) {
//           let _char = sameDirFile[0][i];
//           let isSame = true;
//           for (let item of sameDirFile) {
//             if (item[i] !== _char) {
//               isSame = false;
//               break;
//             }
//           }
//           if (!isSame) {
//             endDir = sameDirFile[0].split("").splice(0, i).join("");
//             break;
//           }
//         }
//         endDir = endDir.split("//")[1];
//         let ssss = endDir.split("/");
//         ssss.pop();
//         imgFileName = ssss.join("/");
//       } else if (sameDirFile.length == 1) {
//         trace(
//           `注意：一张图片合图无意义，请修改配置 ${sameDirFile} ！！！！！！！！！！`
//         );
//         let endDir = sameDirFile[0].split("//")[1];
//         let ffff = endDir.split("/");
//         ffff.pop();
//         ffff.pop();
//         imgFileName = ffff.join("/");
//       }
//       trace(`uuid= ${uuid}  imgFileName = ${imgFileName}`);
//       buildAssetsInfo.textures[uuid] = {
//         name: imgFileName,
//         path: _buildAssets[uuid].nativePath,
//       };
//     }
//   }
//   trace(`Editor.Project.path = ${Editor.Project.path}`);
//   let jsonPath = path.join(Editor.Project.path, "buildtexture.json");
//   trace(` 一共搜索出 ${Object.keys(buildAssetsInfo.textures).length} 张图片`);
//   trace(
//     ` ${jsonPath} 图片名和路径映射 ${JSON.stringify(
//       buildAssetsInfo.textures,
//       null,
//       2
//     )}`
//   );
//   // fs.unlinkSync(jsonPath);
//   fs.writeFileSync(jsonPath, JSON.stringify(buildAssetsInfo.textures, null, 2));
//   callback && callback();
// }

module.exports = {
  load() {
    // Editor.Builder.on('before-change-files', onBeforeBuildFinish);
    Editor.Builder.on("build-finished", onBeforeBuildFinish);
  },

  unload() {
    // Editor.Builder.removeListener('before-change-files', onBeforeBuildFinish);
    Editor.Builder.removeListener("build-finished", onBeforeBuildFinish);
  },
};
