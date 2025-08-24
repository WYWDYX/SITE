import json
import os
from pathlib import Path

def generate_app_json():
    """生成应用JSON文件的交互式工具"""
    
    print("欢迎使用WYWDYX STORE应用商店JSON生成器！")
    print("features和info的icon为Google Icon图标库ID")
    print("请按照提示输入应用信息，对于可选字段可以直接按回车跳过。\n")
    
    # 收集基本应用信息
    app_data = {
        "app": {
            "name": input("请输入应用名称 (name): ").strip(),
            "icon": input("请输入应用图标路径 (icon): ").strip(),
            "tags": input("请输入应用标签(用逗号分隔) (tags): ").strip().split(','),
            "description": input("请输入应用简短描述图标 (description): ").strip(),
            "description-text": input("请输入应用简短描述 (description-text): ").strip(),
            "downloadUrl": input("请输入应用下载URL (downloadUrl): ").strip()
        },
        "screenshots": {
            "phoneSrc": input("请输入手机截图路径 (phoneSrc): ").strip(),
            "tabletSrc": input("请输入平板截图路径 (tabletSrc): ").strip(),
            "alt": input("请输入截图alt文本 (alt): ").strip()
        },
        "about": {
            "title": input("请输入关于部分的标题 (about.title): ").strip(),
            "content": input("请输入关于部分的内容(用|分隔段落) (about.content): ").strip().split('|')
        }
    }
    
    # 收集特性信息
    features = []
    print("\n现在开始输入应用特性 (按回车跳过或停止添加)")
    while True:
        icon = input("特性图标 (features.icon): ").strip()
        if not icon:
            break
            
        title = input("特性标题 (features.title): ").strip()
        description = input("特性描述 (features.description): ").strip()
        
        features.append({
            "icon": icon,
            "title": title,
            "description": description
        })
    
    if features:
        app_data["features"] = features
    
    # 收集应用信息
    app_info = {
        "title": input("应用信息标题 (info.appInfo.title): ").strip(),
        "icon": input("应用信息图标 (info.appInfo.icon): ").strip(),
        "name": input("应用名称 (info.appInfo.name): ").strip(),
        "version": input("应用版本 (info.appInfo.version): ").strip(),
        "size": input("应用大小 (info.appInfo.size): ").strip(),
        "compatibility": input("兼容性 (info.appInfo.compatibility): ").strip(),
        "developer": input("开发者 (info.appInfo.developer): ").strip()
    }
    
    app_data["info"] = {"appInfo": app_info}
    
    # 可选：收集CSS变量
    css_choice = input("\n是否要设置CSS变量? (y/N): ").strip().lower()
    if css_choice == 'y':
        css_vars = {"light": {}, "dark": {}}
        print("请输入亮色主题CSS变量 (按回车跳过):")
        for var in ["--color-bg", "--color-text", "--color-border", "--color-accent", 
                   "--color-header-bg", "--color-card-bg", "--color-footer-bg", 
                   "--color-tag-bg", "--color-tag-text", "--color-btn-bg", 
                   "--color-btn-text", "--color-btn-hover-bg", "--color-btn-hover-text",
                   "--color-selection-fg", "--color-selection-bg"]:
            value = input(f"{var}: ").strip()
            if value:
                css_vars["light"][var] = value
        
        print("\n请输入暗色主题CSS变量 (按回车跳过):")
        for var in ["--color-bg", "--color-text", "--color-border", "--color-accent", 
                   "--color-header-bg", "--color-card-bg", "--color-footer-bg", 
                   "--color-tag-bg", "--color-tag-text", "--color-btn-bg", 
                   "--color-btn-text", "--color-btn-hover-bg", "--color-btn-hover-text",
                   "--color-selection-fg", "--color-selection-bg"]:
            value = input(f"{var}: ").strip()
            if value:
                css_vars["dark"][var] = value
        
        app_data["cssVariables"] = css_vars
    
    # 可选：收集附带信息
    track_choice = input("\n是否要设置附带信息? (y/N): ").strip().lower()
    if track_choice == 'y':
        print("附带信息可以包含任何与应用相关的额外信息")
        track_info = {
            "title": input("附带信息标题 (info.trackInfo.title): ").strip(),
            "icon": input("附带信息图标 (info.trackInfo.icon): ").strip(),
            "name": input("名称 (info.trackInfo.name): ").strip(),
        }
        
        # 添加其他可能的字段
        additional_fields = {}
        print("\n可以添加其他附带信息字段 (按回车停止添加):")
        while True:
            field = input("字段名: ").strip()
            if not field:
                break
            value = input(f"{field}的值: ").strip()
            additional_fields[field] = value
        
        track_info.update(additional_fields)
        app_data["info"]["trackInfo"] = track_info
    
    # 确定保存路径
    base_dir = Path("../Json/AppStore")
    base_dir.mkdir(parents=True, exist_ok=True)
    
    app_name = app_data["app"]["name"]
    safe_name = "".join(c for c in app_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
    file_stem = safe_name.replace(' ', '_')
    
    # 处理文件名冲突
    counter = 0
    while True:
        if counter == 0:
            filename = base_dir / f"{file_stem}.json"
        else:
            filename = base_dir / f"{file_stem}_{counter}.json"
        
        if not filename.exists():
            break
        counter += 1
    
    # 保存JSON文件
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(app_data, f, ensure_ascii=False, indent=4)
    
    print(f"\n应用JSON文件已成功生成: {filename}")
    print("请检查文件内容，确认无误后即可上传到应用商店。")
    print("Copyright © WYWDYX")

if __name__ == "__main__":
    generate_app_json()