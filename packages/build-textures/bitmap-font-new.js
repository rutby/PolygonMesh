"use strict";
const t = require("fire-fs"),
  e = require("fire-path"),
  r = Editor.metas["custom-asset"],
  i = require("./fnt-parser-new");
module.exports = class extends r {
  constructor(t) {
    super(t), (this.textureUuid = ""), (this.fontSize = -1);
  }
  static version() {
    return "2.1.2";
  }
  static defaultType() {
    return "bitmap-font";
  }
  getRealFntTexturePath(r, i) {
    var s = -1 !== r.indexOf(":"),
      a = e.basename(r);
    s && (a = e.win32.basename(r));
    var n = e.join(e.dirname(i), a);
    return (
      t.existsSync(n) ||
        Editor.error(
          "Parse Error: Unable to find file Texture, the path: " + n
        ),
      n
    );
  }
  import(e, r) {
    var s = t.readFileSync(e, "utf8"),
      a = i.parseFnt(s);
    if (((this._fntConfig = a), !a.fontSize)) return r();
    if (((this.fontSize = a.fontSize), "" === this.textureUuid)) {
      var n = this.getRealFntTexturePath(a.atlasName, e);
      this.textureUuid = Editor.assetdb.fspathToUuid(n);
    }
    return r();
  }
  postImport(t, r) {
    var i = this._assetdb,
      s = new cc.BitmapFont();
    s.name = e.basenameNoExt(t);
    var a = i.loadMetaByUuid(this.textureUuid);
    if (a)
      if ("raw" === a.type)
        Editor.error(
          `The '${s.name}' used the wrong texture type. Only sprite types supported.`
        );
      else {
        var n = a.getSubMetas(),
          o = i.uuidToFspath(a.uuid),
          u = n[e.basenameNoExt(o)];
        s.spriteFrame = Editor.serialize.asAsset(u.uuid);
      }
    else Editor.warn(`The texture file of BitmapFont '${t}' is missing.`);
    return (
      (s.fontSize = this.fontSize),
      (s._fntConfig = this._fntConfig),
      i.saveAssetToLibrary(this.uuid, s),
      r()
    );
  }
};
