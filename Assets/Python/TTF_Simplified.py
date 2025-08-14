#!/usr/bin/env python3
"""
TTF字体精简工具 - 移除非指定字符
用法:
  按文本保留: python TTF_Simplified.py <输入字体> <输出字体> -t <文本文件>
  按语言保留: python TTF_Simplified.py <输入字体> <输出字体> -l <语言>
  组合保留: python TTF_Simplified.py <输入字体> <输出字体> -l <语言1+语言2> -t <文本文件>
支持语言: English, 简体中文
"""

import argparse
from fontTools.ttLib import TTFont
from fontTools import subset
import sys
import os

# 语言到Unicode范围的映射
LANGUAGE_RANGES = {
    "English": [
        (0x0000, 0x007F),  # 基础拉丁字母
        (0x0080, 0x00FF),  # 拉丁补充
        (0x2000, 0x206F),  # 常用标点
        (0x20A0, 0x20CF),  # 货币符号
    ],
    "简体中文": [
        (0x4E00, 0x9FFF),  # CJK统一表意文字
        (0x3400, 0x4DBF),  # CJK扩展A
        (0x3000, 0x303F),  # CJK符号和标点
        (0xFF00, 0xFFEF),  # 半形/全形字符
        (0x2000, 0x206F),  # 通用标点
        (0x2010, 0x2017),  # 连字符/破折号
    ],
    "日语": [  # 新增日语支持
        (0x3040, 0x309F),  # 平假名
        (0x30A0, 0x30FF),  # 片假名
        (0x31F0, 0x31FF),  # 片假名音标扩展
        (0x4E00, 0x9FFF),  # CJK统一表意文字 (汉字)
        (0x3400, 0x4DBF),  # CJK扩展A
        (0x3000, 0x303F),  # CJK符号和标点
        (0xFF00, 0xFFEF),  # 半形/全形字符
        (0x2000, 0x206F),  # 通用标点
        (0x1B000, 0x1B0FF),  # 假名补充 (Kana Supplement)
        (0x1D000, 0x1D0FF),  # 音乐符号 (部分日语字体包含)
        (0x3200, 0x32FF),  # 带圈字母数字 (日本語囲み文字)
        (0x1F200, 0x1F2FF),  # 带圈表意文字补充 (日本語特殊囲み)
    ]
}

def get_chars_from_text(text_file):
    """从文本文件中提取唯一字符"""
    with open(text_file, "r", encoding="utf-8") as f:
        text = f.read()
    return set(ord(char) for char in text)

def get_chars_from_language(languages):
    """获取语言对应的Unicode字符范围"""
    chars = set()
    for lang in languages.split('+'):
        if lang not in LANGUAGE_RANGES:
            raise ValueError(f"不支持的语言: {lang}")
        for start, end in LANGUAGE_RANGES[lang]:
            chars.update(range(start, end + 1))
    return chars

def main():
    parser = argparse.ArgumentParser(
        description="TTF字体精简工具 - 按指定文本或语言保留字符",
        epilog="示例:\n"
               "  python TTF_Simplified.py font.ttf newfont.ttf -t input.txt\n"
               "  python TTF_Simplified.py font.ttf newfont.ttf -l English\n"
               "  python TTF_Simplified.py font.ttf newfont.ttf -l 简体中文+English -t extra.txt",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("input_font", help="输入TTF字体文件")
    parser.add_argument("output_font", help="输出TTF字体文件")
    parser.add_argument("-t", "--text", help="包含保留字符的文本文件")
    parser.add_argument("-l", "--lang", help="保留的语言(English/简体中文)，多语言用+连接")

    args = parser.parse_args()

    if not args.text and not args.lang:
        print("错误：必须指定文本文件(-t)或语言(-l)参数")
        sys.exit(1)

    # 收集需要保留的字符
    keep_chars = set()
    
    if args.text:
        if not os.path.exists(args.text):
            print(f"错误：文本文件不存在 {args.text}")
            sys.exit(1)
        keep_chars |= get_chars_from_text(args.text)
    
    if args.lang:
        try:
            keep_chars |= get_chars_from_language(args.lang)
        except ValueError as e:
            print(e)
            sys.exit(1)

    # 加载字体并精简
    font = TTFont(args.input_font)
    options = subset.Options()
    options.drop_tables = []  # 保留所有表
    options.glyph_names = True
    options.retain_gids = False
    
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=keep_chars)
    subsetter.subset(font)
    
    # 保存精简后的字体
    font.save(args.output_font)
    print(f"精简完成! 输出字体: {args.output_font}")
    print(f"保留字符数: {len(keep_chars)}")

if __name__ == "__main__":
    main()