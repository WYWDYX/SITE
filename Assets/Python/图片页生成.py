import os
import re

base_dir = "Assets/Text/空洞骑士－游荡者日记"

# 获取所有Part目录并按照数字排序
part_dirs = []
for name in os.listdir(base_dir):
    if name.startswith("Part-") and os.path.isdir(os.path.join(base_dir, name)):
        try:
            part_num = int(name.split("-")[1])
            part_dirs.append((part_num, name))
        except (IndexError, ValueError):
            continue

# 按目录序号排序
part_dirs.sort(key=lambda x: x[0])

for part_num, dir_name in part_dirs:
    part_path = os.path.join(base_dir, dir_name)
    
    # 收集目录中的所有.webp文件
    images = []
    for file in os.listdir(part_path):
        if file.endswith(".webp") and file.startswith("Image-"):
            try:
                # 提取图片序号
                img_num = int(re.search(r"Image-(\d+)", file).group(1))
                images.append((img_num, file))
            except (AttributeError, ValueError):
                continue
    
    # 按图片序号排序
    images.sort(key=lambda x: x[0])
    
    # 生成文本内容 - 使用单行格式
    content_lines = []
    total_images = len(images)
    
    for idx, (img_num, img_file) in enumerate(images):
        img_path = f"../{base_dir}/{dir_name}/{img_file}"
        
        # 如果是奇数部分的最后一张图片，添加特殊ID
        if total_images % 2 == 1 and idx == total_images - 1:
            content_lines.append(f'<img src="{img_path}" alt="空洞骑士－游荡者日记" id="last-odd-img">')
        else:
            content_lines.append(f'<img src="{img_path}" alt="空洞骑士－游荡者日记">')
    
    # 将内容连接成字符串，并添加前后标签和CSS样式
    content = f"</p>{''.join(content_lines)}<p>"
    content += "<style>#txtContent {background: 0;backdrop-filter: blur(0px);-webkit-backdrop-filter: blur(0px);border-radius: 0;border: 0;box-shadow: 0 0 0 rgba(0, 0, 0, 0);padding: 0}</style>"
    
    # 写入文本文件
    output_file = os.path.join(base_dir, f"Text-{part_num}.txt")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"生成: {output_file}")

print("所有文件生成完成！")