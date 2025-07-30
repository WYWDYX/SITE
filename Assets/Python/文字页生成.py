import re
import os
import sys
from colorama import Fore, Style, init

# 初始化colorama
init(autoreset=True)

def chinese_num_to_arabic(num_str):
    """将中文数字转换为阿拉伯数字（支持1-99999）"""
    num_map = {
        '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
        '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
        '十': 10, '百': 100, '千': 1000, '万': 10000
    }
    
    # 处理阿拉伯数字
    if num_str.isdigit():
        return int(num_str)
    
    # 处理中文数字
    total = 0
    current = 0
    prev_unit = 100000  # 上一个单位的大小
    
    for char in num_str:
        if char in num_map:
            value = num_map[char]
            if value < 10:  # 数字
                current = value
            else:  # 单位
                if current == 0:
                    current = 1
                if value > prev_unit:
                    total = (total + current) * value
                else:
                    total += current * value
                current = 0
                prev_unit = value
    
    return total + current

def find_headings(lines):
    """查找所有可能的标题行（部/卷/章）"""
    # 统一JavaScript中的正则表达式
    part_volume_pattern = r'^第([零一二三四五六七八九十百千万\d]+|\{.+?\})(部|卷)\s'
    chapter_pattern = r'^第([零一二三四五六七八九十百千万\d]+|\{.+?\})章\s'
    
    headings = []
    
    for idx, line in enumerate(lines):
        line_stripped = line.strip()
        match_pv = re.match(part_volume_pattern, line_stripped)
        match_chapter = re.match(chapter_pattern, line_stripped)
        
        if match_pv:
            headings.append({
                'line_number': idx,
                'content': line.rstrip('\n'),
                'type': 'part_volume'
            })
        elif match_chapter:
            chapter_num_str = match_chapter.group(1)
            try:
                chapter_num = chinese_num_to_arabic(chapter_num_str)
            except:
                chapter_num = None
                
            headings.append({
                'line_number': idx,
                'content': line.rstrip('\n'),
                'type': 'chapter',
                'number': chapter_num
            })
    
    return headings

def validate_headings(headings, lines):
    """验证章节连续性并进行交互式修正"""
    chapters = [h for h in headings if h['type'] == 'chapter']
    if not chapters:
        return headings
    
    valid_chapters = [chapters[0]]
    prev_num = chapters[0]['number']
    
    for i in range(1, len(chapters)):
        current = chapters[i]
        current_num = current['number']
        
        # 跳过无法解析的章节
        if current_num is None:
            print(f"跳过无法解析的章节: {current['content']}")
            continue
        
        # 检查是否连续或重置
        if current_num == prev_num + 1 or current_num == 1:
            valid_chapters.append(current)
            prev_num = current_num
            continue
        
        # 发现不连续章节
        print(f"\n发现不连续章节: 上一章 {prev_num}, 当前章 {current_num}")
        
        # 显示上下文
        start_idx = valid_chapters[-1]['line_number']
        end_idx = current['line_number']
        
        print(f"\n上下文 ({start_idx+1}-{end_idx+1} 行):")
        for j in range(start_idx, end_idx + 1):
            line_content = lines[j].rstrip('\n')
            if j == current['line_number']:
                print(f"{Fore.RED}{j+1}: {line_content}{Style.RESET_ALL}")
            else:
                print(f"{j+1}: {line_content}")
        
        # 用户输入处理
        while True:
            choice = input("\n请选择操作: "
                          "\n1. 保留当前章节行"
                          "\n2. 跳过当前章节行"
                          "\n3. 手动指定章节行号"
                          "\n输入选项 (1/2/3): ")
            
            if choice == '1':
                valid_chapters.append(current)
                prev_num = current_num
                break
            elif choice == '2':
                print(f"已跳过章节: {current['content']}")
                break
            elif choice == '3':
                try:
                    selected_line = int(input("请输入正确的行号: ")) - 1
                    if start_idx < selected_line <= end_idx:
                        # 验证新选择的行
                        new_line = lines[selected_line].rstrip('\n')
                        if re.match(chapter_pattern, new_line):
                            match = re.match(r'^第([零一二三四五六七八九十百千\d]+)章', new_line)
                            if match:
                                new_num = chinese_num_to_arabic(match.group(1))
                                valid_chapters.append({
                                    'line_number': selected_line,
                                    'content': new_line,
                                    'type': 'chapter',
                                    'number': new_num
                                })
                                prev_num = new_num
                                print(f"已选择新章节: {new_line}")
                                break
                            else:
                                print("错误: 无法解析章节号")
                        else:
                            print("错误: 该行不是有效的章节标题")
                    else:
                        print(f"错误: 行号必须在 {start_idx+2} 和 {end_idx+1} 之间")
                except ValueError:
                    print("请输入有效的数字")
            else:
                print("无效选择，请重新输入")
    
    # 重建完整的标题列表（包括部/卷）
    valid_headings = []
    for h in headings:
        if h['type'] == 'part_volume':
            valid_headings.append(h)
        elif h['type'] == 'chapter':
            if any(ch['line_number'] == h['line_number'] for ch in valid_chapters):
                valid_headings.append(h)
    
    return valid_headings

def split_book(input_file):
    """主函数：拆分书籍文件"""
    # 统一JavaScript中的正则表达式
    global part_volume_pattern, chapter_pattern
    part_volume_pattern = r'^第([零一二三四五六七八九十百千万\d]+|\{.+?\})(部|卷)\s'
    chapter_pattern = r'^第([零一二三四五六七八九十百千万\d]+|\{.+?\})章\s'
    
    # 读取文件
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 查找所有标题行
    headings = find_headings(lines)
    
    if not headings:
        print("未找到任何有效的标题（部/卷/章）")
        return
    
    print(f"找到 {len(headings)} 个标题（部/卷/章）")
    
    # 验证并修正章节
    valid_headings = validate_headings(headings, lines)
    
    if not valid_headings:
        print("没有有效的标题可用于拆分")
        return
    
    # 按行号排序
    valid_headings.sort(key=lambda x: x['line_number'])
    
    # 准备输出目录
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)
    
    # 拆分文件
    file_count = 0
    for i, heading in enumerate(valid_headings):
        start_idx = heading['line_number']
        
        # 确定结束位置
        if i < len(valid_headings) - 1:
            end_idx = valid_headings[i+1]['line_number']
        else:
            end_idx = len(lines)
        
        # 处理不同类型的标题
        if heading['type'] == 'part_volume':
            # 部/卷：单独保存为单行文件
            file_count += 1
            output_file = os.path.join(output_dir, f"Text-{file_count}.txt")
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(heading['content'] + "\n")
            print(f"生成部/卷文件: {output_file} - {heading['content']}")
            
        elif heading['type'] == 'chapter':
            # 章节：保存标题和内容
            chapter_content = [heading['content'] + "\n"]
            chapter_content.extend(lines[start_idx+1:end_idx])
            
            file_count += 1
            output_file = os.path.join(output_dir, f"Text-{file_count}.txt")
            with open(output_file, 'w', encoding='utf-8') as f:
                f.writelines(chapter_content)
            print(f"生成章节文件: {output_file} - {heading['content']}")
    
    print(f"\n成功拆分 {file_count} 个文件到 {output_dir}/ 目录")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("用法: python 文字阅读器.py <输入文件>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    split_book(input_file)