import json
import os
import glob
from datetime import datetime
from pathlib import Path

def generate_homepage_json():
    """生成应用商店主页JSON文件"""
    
    # 设置目录路径
    appstore_dir = Path("../Json/AppStore")
    output_file = Path("../Json/AppStore.json")
    
    # 确保输出目录存在
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # 获取所有JSON文件
    json_files = glob.glob(str(appstore_dir / "*.json"))
    
    apps = []
    
    # 处理每个应用文件
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                app_data = json.load(f)
            
            # 提取应用信息
            app_id = Path(file_path).stem  # 使用文件名作为ID
            
            # 从详细JSON中提取信息
            name = app_data["app"]["name"]
            icon = app_data["app"]["icon"]
            tags = app_data["app"]["tags"]
            
            # 提取描述 - 根据段落数量选择
            about_content = app_data["about"]["content"]
            if len(about_content) == 1:
                description = about_content[0]
            else:
                # 如果有多个段落，使用第二个段落（索引1）；如果没有第二个段落则返回空字符串
                description = about_content[1] if len(about_content) > 1 else ""
            
            # 提取背景图 - 使用平板截图
            background = app_data["screenshots"]["tabletSrc"]
            
            # 获取文件修改日期
            file_mtime = os.path.getmtime(file_path)
            date = datetime.fromtimestamp(file_mtime).strftime("%Y-%m-%d")
            
            # 初始设置featured和editorChoice为false
            app_info = {
                "id": app_id,
                "name": name,
                "description": description,
                "icon": icon,
                "background": background,
                "tags": tags,
                "date": date,
                "featured": False,
                "editorChoice": False
            }
            
            apps.append(app_info)
            
        except Exception as e:
            print(f"处理文件 {file_path} 时出错: {e}")
    
    # 询问用户要设置哪些应用为featured
    print("\n请选择要设置为推荐应用 (featured) 的应用ID:")
    print("可用应用ID: " + ", ".join([app["id"] for app in apps]))
    featured_ids = input("请输入应用ID（多个ID用逗号分隔，直接回车跳过）: ").strip().split(',')
    
    # 去除空格和空值
    featured_ids = [id.strip() for id in featured_ids if id.strip()]
    
    # 设置featured标志
    for app in apps:
        if app["id"] in featured_ids:
            app["featured"] = True
    
    # 询问用户要设置哪些应用为editorChoice
    print("\n请选择要设置为编辑选择 (editorChoice) 的应用ID:")
    print("可用应用ID: " + ", ".join([app["id"] for app in apps]))
    editor_choice_ids = input("请输入应用ID（多个ID用逗号分隔，直接回车跳过）: ").strip().split(',')
    
    # 去除空格和空值
    editor_choice_ids = [id.strip() for id in editor_choice_ids if id.strip()]
    
    # 设置editorChoice标志
    for app in apps:
        if app["id"] in editor_choice_ids:
            app["editorChoice"] = True
    
    # 创建最终的主页JSON结构
    homepage_data = {
        "apps": apps
    }
    
    # 保存到文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(homepage_data, f, ensure_ascii=False, indent=4)
    
    print(f"\n应用商店主页JSON已成功生成: {output_file}")
    print(f"共处理了 {len(apps)} 个应用")
    print(f"其中 {len([app for app in apps if app['featured']])} 个应用被设置为推荐")
    print(f"其中 {len([app for app in apps if app['editorChoice']])} 个应用被设置为编辑选择")

if __name__ == "__main__":
    generate_homepage_json()