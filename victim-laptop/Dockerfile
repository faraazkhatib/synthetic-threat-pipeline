FROM python:3.9-slim

# Install system utilities, curl, and lsb-release (strictly required by Wazuh)
RUN apt-get update && apt-get install -y curl procps lsb-release

# Download and install the Wazuh Agent (Version 4.7.2)
RUN curl -so wazuh-agent.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.7.2-1_amd64.deb \
    && dpkg -i wazuh-agent.deb \
    && rm wazuh-agent.deb

# Set up our Victim App
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .

# Copy and set permissions for the startup script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Open port 5000 for the web app
EXPOSE 5000

# Run the startup script
CMD ["./entrypoint.sh"]
