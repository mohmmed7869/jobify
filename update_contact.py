import os

replacements = {
    'mohom77393@gmail.com': 'mohom77393@gmail.com',
    'mohom77393@gmail.com': 'mohom77393@gmail.com',
    'mohom77393@gmail.com': 'mohom77393@gmail.com',
    '783332292': '783332292'
}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified = False
        new_content = content
        for old, new in replacements.items():
            if old in new_content:
                new_content = new_content.replace(old, new)
                modified = True
                
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated: {filepath}')
    except Exception as e:
        pass

def process_dir(directory):
    for root, _, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or 'build' in root:
            continue
        for file in files:
            if file.endswith(('.js', '.jsx', '.json', '.md', '.py', '.txt', '.css', '.html', '.bat')):
                replace_in_file(os.path.join(root, file))

process_dir(os.getcwd())
print('Replacement complete.')
