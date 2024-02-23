const e = require("fire-path"),
  t = require("fire-fs"),
  a = require("lodash"),
  r = require("globby"),
  i = require("del"),
  s = require(Editor.url("app://editor/page/build/texture-packer/packer")),
  n = Editor.require("app://editor/page/build/texture-compress");
async function o(r, i, s, n) {
  let o = e.join(r, "info.json"),
    u = {};
  t.existsSync(o) &&
    (!(u = t.readJSONSync(o)) ||
      (u.projectPath === Editor.remote.Project.path &&
        u.actualPlatform === n) ||
      (u = {}));
  let m = {
      projectPath: Editor.remote.Project.path,
      actualPlatform: n,
      mtimes: {}
    },
    l = [i.meta.uuid];
  return s.forEach(e => {
    l.push(e._uuid), l.push(e.getTexture()._uuid);
  }), (l = a.uniq(l)), await Promise.all(
    l.map(async e => {
      let t = await new Promise((t, a) => {
        Editor.assetdb.queryMetaInfoByUuid(e, (e, r) => {
          if (e) return a(e);
          t({ assetMtime: r.assetMtime, metaMtime: r.metaMtime });
        });
      });
      m.mtimes[e] = t;
    })
  ), { storedPacInfoPath: o, newStoredPacInfo: m, storedPacInfo: u };
}

(exports.queryAtlases = async function(i, caches) {
  let s = { textureUuids: [], spriteFrames: [], pacInfos: [], texture2pac: {} };
  return (i = Array.isArray(i) ? i : [i]), await Promise.all(
    i.map(async i => {
      let n = await new class {
        async init(i) {
          if (!caches || !caches[i.path]) {
            let s,
              csps,
              n = i.path,
              o = n + ".meta",
              u = t.readJSONSync(o);

            let m = e.dirname(i.url) + "/**/*",
              l = await new Promise((e, t) => {
                Editor.assetdb.queryAssets(m, ["sprite-frame"], (a, r) => {
                  if (a) return t(a);
                  e(r);
                });
              });

            let c = e.dirname(n),
              p = [e.join(c, "**/*.pac"), "!" + e.join(c, "*.pac")],
              d = await new Promise((t, a) => {
                r(p, (r, i) => {
                  if (r) return a(r);
                  t(i.map(t => e.dirname(t)));
                });
              });
            caches && (caches[i.path] = {});
            let cpcs = caches ? caches[i.path] : undefined;
            return 0 ===
            (l = l.filter(t => {
              for (let a = 0; a < d.length; a++)
                if (e.contains(d[a], t.path)) return !1;
              return !0;
            })).length
              ? (
                  cpcs && (csps = cpcs.sps = []),
                  (s = []),
                  Editor.warn(
                    `No SpriteFrame find in folder [${e.dirname(
                      i.url
                    )}]. Please check the AutoAtlas [${n}].`
                  )
                )
              : (
                  cpcs && (csps = cpcs.sps = []),
                  (s = await Promise.all(
                    l.map(
                      async e =>
                        new Promise((t, a) => {
                          cc.assetManager.loadAny(e.uuid, (e, r) => {
                            if (e) return a(e);
                            if (csps) {
                              csps[csps.length] = r;
                            }
                            (r.pacInfo = this), t(r);
                          });
                        })
                    )
                  )),
                  (s = a.sortBy(s, "_uuid")),
                  cpcs && (cpcs.sps = a.sortBy(csps, "_uuid"))
                ), (this.meta = u), cpcs &&
              (cpcs.u = u), (this.info = i), cpcs &&
              (cpcs.i = i), (this.spriteFrames = s), (this.relativePath = i.url.replace(
              "db://",
              ""
            )), cpcs && (cpcs.r = this.relativePath), this;
          } else {
            let cpcs = caches[i.path];
            this.meta = cpcs.u;
            this.info = cpcs.i;
            this.relativePath = cpcs.r;
            let s = [];
            let length = cpcs.sps.length;
            for (let cnt = 0; cnt < length; ++cnt) {
              s[cnt] = cpcs.sps[cnt];
              s[cnt].pacInfo = this;
            }
            this.spriteFrames = s;
          }
          return this;
        }
      }().init(i);
      n.spriteFrames.forEach(e => {
        let t = e.getTexture()._uuid;
        s.textureUuids.push(t), (s.texture2pac[t] = n);
      }), (s.spriteFrames = s.spriteFrames.concat(
        n.spriteFrames
      )), s.pacInfos.push(n);
    })
  ), (s.textureUuids = a.uniq(s.textureUuids)), (s.spriteFrames = a.uniq(
    s.spriteFrames
  )), s;
}), (exports.pack = async function(r) {
  let {
      pacInfos: u,
      buildAssets: m,
      dest: l,
      needCompress: c,
      platform: p,
      actualPlatform: d
    } = r,
    f = [];
  for (let r = 0; r < u.length; r++) {
    let m,
      h = u[r],
      P = h.meta,
      y = cc.js.mixin(
        {
          name: e.basenameNoExt(h.info.path),
          width: P.maxWidth,
          height: P.maxHeight
        },
        P
      ),
      w = e.join(l, h.relativePath),
      g = h.spriteFrames,
      { storedPacInfoPath: x, newStoredPacInfo: q, storedPacInfo: E } = await o(
        w,
        h,
        g,
        d
      );
    !a.isEqual(q.mtimes, E.mtimes)
      ? (
          i.sync(w.replace(/\\/g, "/"), { force: !0 }),
          (m = await new Promise((e, t) => {
            s(g, y, (a, r) => {
              if (a) return t(a);
              e(r);
            });
          })),
          await Promise.all(
            m.atlases.map(async a => {
              let r = e.join(w, a.name + ".png");
              return t.ensureDirSync(
                e.dirname(r)
              ), (a.imagePath = r), new Promise((e, t) => {
                a.sharp.toFile(r, a => {
                  if (a) return t(a);
                  e();
                });
              });
            })
          ),
          global.gc && global.gc(),
          c &&
            (await Promise.all(
              m.atlases.map(async a => {
                let r = e.join(w, "compressed", a.name + ".png");
                t.ensureDirSync(e.dirname(r));
                let i = await new Promise((e, t) => {
                  n(
                    {
                      src: a.imagePath,
                      dst: r,
                      platform: p,
                      actualPlatform: d,
                      compressOption: h.meta.platformSettings
                    },
                    (a, r) => {
                      if (a) return t(a);
                      e(r);
                    }
                  );
                });
                0 === i.length && (i = [".png"]), (a.compressd = {
                  suffix: i,
                  imagePathNoExt: e.join(e.dirname(r), e.basenameNoExt(r))
                });
              })
            )),
          (q.result = m),
          t.ensureDirSync(w),
          t.writeFileSync(x, JSON.stringify(q, null, 2))
        )
      : (m = E.result).atlases.forEach(e => {
          e.files.forEach(e => {
            e.spriteFrame = g.find(t => t._uuid === e.uuid);
          });
        }), (m.pacInfo = h), f.push(m);
  }
  return f;
});
