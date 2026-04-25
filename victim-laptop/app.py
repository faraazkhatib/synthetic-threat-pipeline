from flask import Flask, request
import logging
import datetime

app = Flask(__name__)

# Set up logging to a file that Wazuh will monitor
logging.basicConfig(filename='/var/log/victim_app.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

@app.route('/')
def home():
    return "<h1>Company Internal Portal</h1><p>Please navigate to /login</p>"

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        ip_address = request.remote_addr
        
        # Simulate a failed login and log it!
        logging.warning(f"Failed login attempt - User: {username} - IP: {ip_address}")
        return "Invalid credentials. This attempt has been logged.", 401
        
    return '''
        <form method="POST">
            Username: <input type="text" name="username"><br>
            Password: <input type="password" name="password"><br>
            <input type="submit" value="Login">
        </form>
    '''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)