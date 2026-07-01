"""
Static radical name/meaning table.

KANJIDIC2 only gives a kanji's classical radical *number*, and KRADFILE only gives
a kanji's component *glyphs* — neither ships English names or meanings. This module
supplies that missing metadata for the radical detail view.

The keys are the exact component glyphs emitted by KRADFILE-u (kradfile-u.gz), which
is a superset (~253 elements) of the 214 classical Kangxi radicals: it also includes
common variant forms (e.g. 氵 灬 扌 忄 ⺅) and a handful of KRADFILE's own stroke
primitives drawn with katakana-like shapes (ノ ハ ヨ マ ユ ｜). Where a glyph is a
classical radical (or a variant of one), `kangxi_number` is set so the kanji detail
view can map KANJIDIC2's classical radical number back to a glyph + meaning.

Each value is a dict: {meaning, reading, strokes, kangxi_number}.
  - meaning: short English name/meaning (None only if genuinely unknown)
  - reading: Japanese bushu name in hiragana ("" when there is no established name)
  - strokes: stroke count of the element
  - kangxi_number: 1–214 for classical radicals / their variants, else None

Sources (all CC BY-SA / public): EDRDG KRADFILE/RADKFILE, the Unicode Kangxi Radicals
chart, the Wikipedia "Kangxi radicals" table, and kanjialive's 214-radical list.
"""

# glyph -> (meaning, reading, strokes, kangxi_number)
_RADICALS = {
    # --- 1-stroke classical radicals + KRADFILE 1-stroke primitives ---
    "一": ("one", "いち", 1, 1),
    "｜": ("line", "ぼう", 1, 2),          # KRADFILE glyph for radical 丨
    "丶": ("dot", "てん", 1, 3),
    "ノ": ("slash", "の", 1, 4),           # KRADFILE glyph for radical 丿
    "乙": ("second, fishhook", "おつ", 1, 5),
    "亅": ("hook", "はねぼう", 1, 6),

    # --- 2-stroke ---
    "二": ("two", "に", 2, 7),
    "亠": ("lid", "なべぶた", 2, 8),
    "人": ("person", "ひと", 2, 9),
    "⺅": ("person (left)", "にんべん", 2, 9),
    "𠆢": ("person (top)", "ひとやね", 2, 9),
    "儿": ("legs", "ひとあし", 2, 10),
    "入": ("enter", "いる", 2, 11),
    "ハ": ("eight", "はち", 2, 12),         # KRADFILE glyph for radical 八
    "并": ("horns, together", "", 2, None),  # KRADFILE splayed-top element (丷-like)
    "冂": ("down box", "けいがまえ", 2, 13),
    "冖": ("cover", "わかんむり", 2, 14),
    "冫": ("ice", "にすい", 2, 15),
    "几": ("table", "つくえ", 2, 16),
    "凵": ("open box", "うけばこ", 2, 17),
    "刀": ("knife", "かたな", 2, 18),
    "刂": ("knife (right)", "りっとう", 2, 18),
    "力": ("power", "ちから", 2, 19),
    "勹": ("wrap", "つつみがまえ", 2, 20),
    "匕": ("spoon", "さじ", 2, 21),
    "匚": ("box", "はこがまえ", 2, 22),
    "十": ("ten", "じゅう", 2, 24),
    "卜": ("divination", "ぼく", 2, 25),
    "卩": ("seal", "ふしづくり", 2, 26),
    "厂": ("cliff", "がんだれ", 2, 27),
    "厶": ("private", "む", 2, 28),
    "又": ("again", "また", 2, 29),
    "乃": ("whereupon", "", 2, None),
    "九": ("nine", "", 2, None),
    "マ": ("ma (stroke shape)", "", 2, None),  # KRADFILE primitive (as in 予, 矛)

    # --- 3-stroke ---
    "口": ("mouth", "くち", 3, 30),
    "囗": ("enclosure", "くにがまえ", 3, 31),
    "土": ("earth", "つち", 3, 32),
    "士": ("scholar", "さむらい", 3, 33),
    "夂": ("go", "ふゆがしら", 3, 34),
    "夕": ("evening", "ゆうべ", 3, 36),
    "大": ("big", "だい", 3, 37),
    "女": ("woman", "おんな", 3, 38),
    "子": ("child", "こ", 3, 39),
    "宀": ("roof", "うかんむり", 3, 40),
    "寸": ("inch", "すん", 3, 41),
    "小": ("small", "しょう", 3, 42),
    "⺌": ("small (top)", "しょうがしら", 3, 42),
    "尢": ("lame", "だいのまげあし", 3, 43),
    "尤": ("still, more", "", 4, 43),
    "尸": ("corpse", "しかばね", 3, 44),
    "屮": ("sprout", "てつ", 3, 45),
    "山": ("mountain", "やま", 3, 46),
    "巛": ("river", "まがりがわ", 3, 47),
    "川": ("river", "かわ", 3, 47),
    "工": ("work", "たくみ", 3, 48),
    "已": ("oneself", "おのれ", 3, 49),
    "巴": ("snake, handle", "", 4, None),
    "巾": ("cloth", "はば", 3, 50),
    "干": ("dry", "ほす", 3, 51),
    "幺": ("short thread", "いとがしら", 3, 52),
    "广": ("dotted cliff", "まだれ", 3, 53),
    "廴": ("long stride", "えんにょう", 3, 54),
    "廾": ("two hands", "にじゅうあし", 3, 55),
    "弋": ("ceremony", "しきがまえ", 3, 56),
    "弓": ("bow", "ゆみ", 3, 57),
    "ヨ": ("snout", "けいがしら", 3, 58),
    "彑": ("snout", "けいがしら", 3, 58),
    "彡": ("bristle", "さんづくり", 3, 59),
    "彳": ("step", "ぎょうにんべん", 3, 60),
    "也": ("also", "", 3, None),
    "亡": ("perish, death", "", 3, None),
    "及": ("reach", "", 3, None),
    "久": ("long time", "", 3, None),
    "屯": ("barracks, sprout", "", 4, None),

    # --- 4-stroke ---
    "心": ("heart", "こころ", 4, 61),
    "忄": ("heart (left)", "りっしんべん", 3, 61),
    "戈": ("halberd", "ほこ", 4, 62),
    "戸": ("door", "とびらのと", 4, 63),
    "手": ("hand", "て", 4, 64),
    "扌": ("hand (left)", "てへん", 3, 64),
    "支": ("branch", "しにょう", 4, 65),
    "攵": ("strike", "ぼくづくり", 4, 66),
    "文": ("script", "ぶん", 4, 67),
    "斗": ("dipper", "とます", 4, 68),
    "斤": ("axe", "おの", 4, 69),
    "方": ("square, direction", "ほう", 4, 70),
    "无": ("not", "むにょう", 4, 71),
    "日": ("sun, day", "ひ", 4, 72),
    "曰": ("say", "いわく", 4, 73),
    "月": ("moon, month", "つき", 4, 74),
    "木": ("tree", "き", 4, 75),
    "欠": ("lack, yawn", "あくび", 4, 76),
    "止": ("stop", "とめる", 4, 77),
    "歹": ("death", "がつへん", 4, 78),
    "殳": ("weapon", "るまた", 4, 79),
    "毋": ("do not", "なかれ", 4, 80),
    "母": ("mother", "はは", 5, 80),
    "比": ("compare", "くらべる", 4, 81),
    "毛": ("fur", "け", 4, 82),
    "氏": ("clan", "うじ", 4, 83),
    "气": ("steam", "きがまえ", 4, 84),
    "水": ("water", "みず", 4, 85),
    "氵": ("water (left)", "さんずい", 3, 85),
    "火": ("fire", "ひ", 4, 86),
    "灬": ("fire (bottom)", "れっか", 4, 86),
    "爪": ("claw", "つめ", 4, 87),
    "父": ("father", "ちち", 4, 88),
    "爻": ("mix", "こう", 4, 89),
    "爿": ("split wood (left)", "しょうへん", 4, 90),
    "片": ("slice", "かた", 4, 91),
    "牙": ("fang", "きば", 4, 92),
    "牛": ("cow", "うし", 4, 93),
    "犬": ("dog", "いぬ", 4, 94),
    "犭": ("dog (left)", "けものへん", 3, 94),
    "元": ("origin", "", 4, None),
    "五": ("five", "", 4, None),
    "井": ("well", "", 4, None),
    "世": ("generation, world", "", 5, None),
    "ユ": ("yu (stroke shape)", "", 2, None),  # KRADFILE primitive

    # --- 5-stroke ---
    "玄": ("dark, mysterious", "げん", 5, 95),
    "王": ("king, jade", "おう", 4, 96),
    "瓜": ("melon", "うり", 5, 97),
    "瓦": ("tile", "かわら", 5, 98),
    "甘": ("sweet", "あまい", 5, 99),
    "生": ("life", "うまれる", 5, 100),
    "用": ("use", "もちいる", 5, 101),
    "田": ("field", "た", 5, 102),
    "疋": ("bolt of cloth", "ひき", 5, 103),
    "疒": ("sickness", "やまいだれ", 5, 104),
    "癶": ("footsteps", "はつがしら", 5, 105),
    "白": ("white", "しろ", 5, 106),
    "皮": ("skin", "けがわ", 5, 107),
    "皿": ("dish", "さら", 5, 108),
    "目": ("eye", "め", 5, 109),
    "矛": ("spear", "ほこ", 5, 110),
    "矢": ("arrow", "や", 5, 111),
    "石": ("stone", "いし", 5, 112),
    "示": ("spirit, show", "しめす", 5, 113),
    "礻": ("spirit (left)", "しめすへん", 4, 113),
    "禸": ("track", "ぐうのあし", 5, 114),
    "禾": ("grain", "のぎ", 5, 115),
    "穴": ("cave, hole", "あな", 5, 116),
    "立": ("stand", "たつ", 5, 117),
    "免": ("exempt", "", 8, None),
    "奄": ("cover, suddenly", "", 8, None),
    "巨": ("huge", "", 5, None),

    # --- 6-stroke ---
    "竹": ("bamboo", "たけ", 6, 118),
    "米": ("rice", "こめ", 6, 119),
    "糸": ("silk, thread", "いと", 6, 120),
    "缶": ("jar", "ほとぎ", 6, 121),
    "罒": ("net", "あみがしら", 5, 122),
    "羊": ("sheep", "ひつじ", 6, 123),
    "羽": ("feather", "はね", 6, 124),
    "⺹": ("old", "おいかんむり", 4, 125),
    "而": ("and, rake", "しかして", 6, 126),
    "耒": ("plow", "すきへん", 6, 127),
    "耳": ("ear", "みみ", 6, 128),
    "聿": ("brush", "ふでづくり", 6, 129),
    "肉": ("meat", "にく", 6, 130),
    "臣": ("minister", "しん", 6, 131),
    "自": ("self", "みずから", 6, 132),
    "至": ("arrive", "いたる", 6, 133),
    "臼": ("mortar", "うす", 6, 134),
    "舌": ("tongue", "した", 6, 135),
    "舛": ("opposite", "まいあし", 6, 136),
    "舟": ("boat", "ふね", 6, 137),
    "艮": ("stopping", "こんづくり", 6, 138),
    "色": ("color", "いろ", 6, 139),
    "⺾": ("grass", "くさかんむり", 3, 140),
    "虍": ("tiger", "とらかんむり", 6, 141),
    "虫": ("insect", "むし", 6, 142),
    "血": ("blood", "ち", 6, 143),
    "行": ("go, line", "ぎょうがまえ", 6, 144),
    "衣": ("clothes", "ころも", 6, 145),
    "衤": ("clothes (left)", "ころもへん", 5, 145),
    "西": ("west, cover", "にし", 6, 146),
    "品": ("goods", "", 9, None),
    "岡": ("ridge, hill", "", 8, None),

    # --- 7-stroke ---
    "見": ("see", "みる", 7, 147),
    "角": ("horn", "つの", 7, 148),
    "言": ("speech", "ことば", 7, 149),
    "谷": ("valley", "たに", 7, 150),
    "豆": ("bean", "まめ", 7, 151),
    "豕": ("pig", "いのこ", 7, 152),
    "豸": ("badger, cat", "むじな", 7, 153),
    "貝": ("shell, money", "かい", 7, 154),
    "赤": ("red", "あか", 7, 155),
    "走": ("run", "はしる", 7, 156),
    "足": ("foot, leg", "あし", 7, 157),
    "身": ("body", "み", 7, 158),
    "車": ("cart, car", "くるま", 7, 159),
    "辛": ("bitter", "からい", 7, 160),
    "辰": ("morning", "しんのたつ", 7, 161),
    "辶": ("walk, road", "しんにょう", 4, 162),
    "⻏": ("village (right)", "おおざと", 3, 163),
    "邑": ("village", "むら", 7, 163),
    "酉": ("wine, bird", "とりへん", 7, 164),
    "釆": ("distinguish", "のごめ", 7, 165),
    "里": ("village, ri", "さと", 7, 166),

    # --- 8-stroke ---
    "金": ("gold, metal", "かね", 8, 167),
    "長": ("long", "ながい", 8, 168),
    "門": ("gate", "もん", 8, 169),
    "⻖": ("mound (left)", "こざとへん", 3, 170),
    "隶": ("slave, capture", "れいづくり", 8, 171),
    "隹": ("small bird", "ふるとり", 8, 172),
    "雨": ("rain", "あめ", 8, 173),
    "青": ("blue, green", "あお", 8, 174),
    "非": ("wrong", "あらず", 8, 175),

    # --- 9-stroke ---
    "面": ("face", "めん", 9, 176),
    "革": ("leather", "かわへん", 9, 177),
    "韋": ("tanned leather", "なめしがわ", 9, 178),
    "韭": ("leek", "にら", 9, 179),
    "音": ("sound", "おと", 9, 180),
    "頁": ("leaf, head", "おおがい", 9, 181),
    "風": ("wind", "かぜ", 9, 182),
    "飛": ("fly", "とぶ", 9, 183),
    "食": ("eat, food", "しょく", 9, 184),
    "首": ("head, neck", "くび", 9, 185),
    "香": ("fragrant", "かおり", 9, 186),

    # --- 10-stroke ---
    "馬": ("horse", "うま", 10, 187),
    "骨": ("bone", "ほね", 10, 188),
    "高": ("tall, high", "たかい", 10, 189),
    "髟": ("long hair", "かみがしら", 10, 190),
    "鬥": ("fight", "たたかいがまえ", 10, 191),
    "鬯": ("sacrificial wine", "ちょう", 10, 192),
    "鬲": ("cauldron", "かなえ", 10, 193),
    "鬼": ("ghost, demon", "おに", 10, 194),

    # --- 11-stroke ---
    "魚": ("fish", "うお", 11, 195),
    "鳥": ("bird", "とり", 11, 196),
    "鹵": ("salt", "しお", 11, 197),
    "鹿": ("deer", "しか", 11, 198),
    "麦": ("wheat", "むぎ", 7, 199),
    "麻": ("hemp", "あさ", 11, 200),

    # --- 12-stroke and up ---
    "黄": ("yellow", "きいろ", 11, 201),
    "黍": ("millet", "きび", 12, 202),
    "黒": ("black", "くろ", 11, 203),
    "黹": ("embroidery", "ふつ", 12, 204),
    "黽": ("frog", "べんあし", 13, 205),
    "鼎": ("tripod", "かなえ", 13, 206),
    "鼓": ("drum", "つづみ", 13, 207),
    "鼠": ("rat", "ねずみ", 13, 208),
    "鼻": ("nose", "はな", 14, 209),
    "齊": ("even, uniform", "せい", 14, 210),
    "斉": ("even, uniform", "せい", 8, 210),
    "歯": ("tooth", "は", 12, 211),
    "竜": ("dragon", "りゅう", 10, 212),
    "亀": ("turtle", "かめ", 11, 213),
    "龠": ("flute", "やく", 17, 214),

    # --- KRADFILE primitives / common elements without a classical number ---
    "無": ("nothing", "", 12, None),
    "滴": ("drip, drop", "", 14, None),
    "勿": ("must not", "", 4, None),
    "冊": ("book, volume", "", 5, None),
    # Classical radicals that never appear as standalone KRADFILE components,
    # included so KANJIDIC classical-number lookups still resolve to a glyph.
    "匸": ("hiding enclosure", "かくしがまえ", 2, 23),
    "夊": ("go slowly", "すいにょう", 3, 35),
}


# KRADFILE-u writes the "walk" radical with the CJK compatibility form U+FA66;
# alias it to the standard form (U+8FB6) so component lookups resolve.
_RADICALS[chr(0xFA66)] = _RADICALS[chr(0x8FB6)]


def get_radical_meta(glyph):
    """Return {meaning, reading, strokes, kangxi_number} for a component glyph, or None."""
    entry = _RADICALS.get(glyph)
    if entry is None:
        return None
    meaning, reading, strokes, kangxi_number = entry
    return {
        "meaning": meaning,
        "reading": reading or None,
        "strokes": strokes,
        "kangxi_number": kangxi_number,
    }


def all_radicals():
    """Yield (glyph, meta_dict) for every named radical in the table."""
    for glyph in _RADICALS:
        yield glyph, get_radical_meta(glyph)
