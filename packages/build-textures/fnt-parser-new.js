"use strict";
var t = {
  INFO_EXP: /info .*?(?=\/>)|info .*/gi,
  COMMON_EXP: /common .*?(?=\/>)|common .*/gi,
  RENDERE_EXP: /render .*?(?=\/>)|render .*/gi,
  ADJUST_EXP: /adjust .*?(?=\/>)|adjust .*/gi,
  PAGE_EXP: /page .*?(?=\/>)|page .*/gi,
  CHAR_EXP: /char .*?(?=\/>)|char .*/gi,
  KERNING_EXP: /kerning .*?(?=\/>)|kerning .*/gi,
  ITEM_EXP: /\w+=[^ \r\n]+/gi,
  NUM_EXP: /^\-?\d+(?:\.\d+)?$/,
  _parseStrToObj: function (t) {
    var e = t.match(this.ITEM_EXP),
      r = {};
    if (e)
      for (var a = 0, i = e.length; a < i; a++) {
        var n = e[a],
          o = n.indexOf("="),
          s = n.substring(0, o),
          c = n.substring(o + 1);
        '"' === c[0]
          ? (c = c.substring(1, c.length - 1)).match(this.NUM_EXP) &&
            (c = parseFloat(c))
          : c.match(this.NUM_EXP) && (c = parseFloat(c)),
          (r[s] = c);
      }
    return r;
  },
  parseFnt: function (t) {
	var e = {};
	e.isSDFFont = 0;
	var r = t.match(this.INFO_EXP);
    if (!r) return e;
    var a = this._parseStrToObj(r[0]),
      i = this._parseStrToObj(t.match(this.COMMON_EXP)[0]);
    if (
      ((e.commonHeight = i.lineHeight),
      (e.fontSize = parseInt(a.size)),
      cc.game.renderType === cc.game.RENDER_TYPE_WEBGL)
    ) {
      var n = cc.configuration.getMaxTextureSize();
      (i.scaleW > n.width || i.scaleH > n.height) &&
        Editor.log(
          "cc.LabelBMFont._parseCommonArguments(): page can't be larger than supported"
        );
    }
    1 !== i.pages &&
      Editor.log(
        "cc.LabelBMFont._parseCommonArguments(): only supports 1 page"
      );
    var o = this._parseStrToObj(t.match(this.PAGE_EXP)[0]);
    0 !== o.id &&
      Editor.log(
        "cc.LabelBMFont._parseImageFileName() : file could not be found"
      ),
      (e.atlasName = o.file);
    for (
      var s = t.match(this.CHAR_EXP),
        c = (e.fontDefDictionary = {}),
        h = 0,
        g = s.length;
      h < g;
      h++
    ) {
      var f = this._parseStrToObj(s[h]);
      c[f.id] = {
        rect: { x: f.x, y: f.y, width: f.width, height: f.height },
        xOffset: f.xoffset,
        yOffset: f.yoffset,
        xAdvance: f.xadvance,
      };
    }
    var E = (e.kerningDict = {}), m = t.match(this.KERNING_EXP);
	if (m) {
	for (h = 0, g = m.length; h < g; h++) {
		var _ = this._parseStrToObj(m[h]);
		E[(_.first << 16) | (65535 & _.second)] = _.amount;
		}
	}
	if (a.isSDFFont) {
		e.isSDFFont = a.isSDFFont;
	}
	/// setup adjust paramters
	e.lineHeightScale = 1;
	e.lineHeightAdd = 0;
	e.fontSizeScale = 1;
	e.fontSizeAdd = 0;
	e.advanceXScale = 1;
	e.advanceXAdd = 0;
	e.gradientScaleRatio = 6;
	e.shadowScaleRatio = 0.38;
	e.faceDilate = 0.0;
	var adjust = t.match(this.ADJUST_EXP);
	if (adjust) {
		var adjustObj = this._parseStrToObj(adjust[0]);
		e.lineHeightScale = adjustObj.lineHeightScale;
		e.lineHeightAdd = adjustObj.lineHeightAdd;
		e.fontSizeScale = adjustObj.fontSizeScale;
		e.fontSizeAdd = adjustObj.fontSizeAdd;
		e.advanceXScale = adjustObj.advanceXScale;
		e.advanceXAdd = adjustObj.advanceXAdd;
		e.gradientScaleRatio = adjustObj.gradientScaleRatio;
		e.shadowScaleRatio = adjustObj.shadowScaleRatio;
		e.faceDilate = adjustObj.faceDilate;
    e.globalOffsetYAdd = adjustObj.globalOffsetYAdd;
    if (!e.globalOffsetYAdd) {
      e.globalOffsetYAdd = 0;
    }
	}

	/// setup custom render parameters
	var render = t.match(this.RENDERE_EXP);
	if (render) {
		var renderObj = this._parseStrToObj(render[0]);
		e.renderInfo = renderObj;
	}

    return e;
  },
};
module.exports = t;
