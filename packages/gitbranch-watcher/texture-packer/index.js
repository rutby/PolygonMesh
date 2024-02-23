const e = require("fire-path"),
  t = (require("async"), require("lodash"), require("fire-fs")),
  i = require("./utils"),
  r = e.join(Editor.remote.Project.path, "temp/TexturePacker/preview"),
  a = e.join(Editor.remote.Project.path, "temp/TexturePacker/build"),
  s = "native";
class l {
  async init(e) {
    (this.writer = e.writer), (this.actualPlatform =
      e.actualPlatform), (this.platform = Editor.remote.Builder.actualPlatform2Platform(
      this.actualPlatform
    )), (this.root = e.root);
    let t = await i.queryAtlases(e.files, e.caches);
    (this.spriteFrames = t.spriteFrames), (this.pacInfos =
      t.pacInfos), (this.textureUuids = t.textureUuids), (this.texture2pac =
      t.texture2pac);
  }
  needPack(e) {
    return -1 !== this.textureUuids.indexOf(e);
  }
  async pack(r) {
    let l = [],
      u = Object.create(null),
      n = Object.create(null),
      o = e.join(a, s),
      c = this.pacInfos;
    c = c.filter(e => !r[e.meta.uuid] || !r[e.meta.uuid].redirect);
    for (let e of c)
      (e.spriteFrames = e.spriteFrames.filter(
        e => !r[e._uuid] || !r[e._uuid].redirect
      )), e.meta.filterUnused &&
        (e.spriteFrames = e.spriteFrames.filter(e => e._uuid in r));
    (c = c.filter(
      e =>
        e.meta.uuid in r || e.spriteFrames.filter(e => e._uuid in r).length > 0
    )), this.root &&
      c.forEach(t => {
        t.meta.filterUnused &&
          e.contains(Editor.url(this.root), t.info.path) &&
          Editor.warn(
            `AutoAtlas "${t.info.path}" is located in "${this
              .root}" directory, so its "Filter Unused Resources" parameter will be ignored.`
          );
      });
    let d = {
        dest: o,
        pacInfos: c,
        buildAssets: r,
        needCompress: !0,
        platform: this.platform,
        actualPlatform: this.actualPlatform
      },
      p = await i.pack(d);
    return await Promise.all(
      p.map(async i => {
        l = l.concat(i.unpackedTextures);
        let a = null;
        i.uuid in r && ((a = new cc.SpriteAtlas())._uuid = i.uuid);
        let o = i.pacInfo.meta;
        for (let r = 0; r < i.atlases.length; ++r) {
          let l = i.atlases[r],
            c = require(Editor.url("app://editor/page/build/hash-uuid")),
            d = l.files.map(e => e.uuid),
            p = c.calculate([d], c.BuiltinHashType.AutoAtlasTexture)[0];
          if (!l.compressd) throw "Cann't find atlas.compressed.";
          let h = l.compressd.suffix,
            m = e.join(this.writer.dest, "..", s, p.slice(0, 2), p);
          n[p] = await Promise.all(
            h.map(
              async e =>
                new Promise((i, r) => {
                  e = e.split("@")[0];
                  let a = l.compressd.imagePathNoExt + e,
                    s = m + e;
                  t.copy(a, s, e => {
                    if (e) return r(e);
                    i(s);
                  });
                })
            )
          );
          let f = new cc.Texture2D();
          (f._exportedExts = h), (f._uuid = p), (f.width = l.width), (f.height =
            l.height), (f.packable = o.packable), f.setPremultiplyAlpha(
            o.premultiplyAlpha
          );
          let w = cc.Texture2D.Filter;
          switch (o.filterMode) {
            case "point":
              f.setFilters(w.NEAREST, w.NEAREST);
              break;
            case "bilinear":
            case "trilinear":
              f.setFilters(w.LINEAR, w.LINEAR);
          }
          await this.write(f);
          for (let e = 0; e < l.files.length; ++e) {
            let t = l.files[e],
              i = this.generateSpriteFrame(t, p);
            (u[i._uuid] = p), a &&
              (a._spriteFrames[t.name] = Editor.serialize.asAsset(
                i._uuid
              )), await this.write(i);
          }
        }
        a && (await this.write(a));
      })
    ), {
      unpackedTextures: l,
      packedSpriteFrames: u,
      packedTextures: n,
      pacInfos: c
    };
  }
  generateSpriteFrame(e, t) {
    let i = new cc.SpriteFrame(),
      r = e.spriteFrame;
    (i._name = e.name), (i._uuid = r._uuid);
    let a = e.trim;
    return (i._rect = cc.rect(
      a.x,
      a.y,
      a.width,
      a.height
    )), (i._offset = r.getOffset()), (i._originalSize = cc.size(
      e.rawWidth,
      e.rawHeight
    )), (i._rotated = e.rotated), (i.insetLeft = r.insetLeft), (i.insetTop =
      r.insetTop), (i.insetRight = r.insetRight), (i.insetBottom =
      r.insetBottom), (i._texture = Editor.serialize.asAsset(t)), i;
  }
  async write(e, t) {
    let i = Editor.serializeCompiled(e, { nicify: !0, stringify: !1 });
    await new Promise((t, r) => {
      this.writer.writeJsonByUuid(e._uuid, i, e => {
        if (e) return r(e);
        t();
      });
    });
  }
}
(l.generatePreviewFiles = async function(e) {
  let t = Editor.remote.assetdb.assetInfoByUuid(e),
    a = r,
    s = await i.queryAtlases(t);
  await i.pack({ pacInfos: s.pacInfos, dest: a });
}), (l.queryPreviewInfo = function(i, a) {
  let s = Editor.remote.assetdb.assetInfoByUuid(i),
    l = s.url.replace("db://", ""),
    u = e.join(r, e.dirname(l), e.basename(s.url)),
    n = e.join(u, "info.json");
  if (!t.existsSync(n)) return a(null);
  let o = t.readJSONSync(n);
  if (!o.result) return a(null);
  a(null, {
    packedTextures: o.result.atlases.map(t => {
      let i = 0;
      t.files.forEach(e => {
        i += e.width * e.height;
      });
      let r = (i / (t.width * t.height) * 100) | 0;
      return {
        path: t.imagePath,
        name: e.basename(t.imagePath),
        result: `${t.width}x${t.height}, ${r}% usage`
      };
    }),
    unpackedTextures: o.result.unpackedTextures.map(t => {
      let i = t.originalPath || t.path,
        r = Editor.assetdb.remote.uuidToFspath(t.textureUuid);
      return { path: i, name: e.basename(r), result: t.width + "x" + t.height };
    })
  });
}), (module.exports = l);
