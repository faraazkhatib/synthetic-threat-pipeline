#!/bin/bash

# Enroll the agent with the Wazuh Manager (using the internal Docker network name)
/var/ossec/bin/agent-auth -m wazuh.manager

# Start the Wazuh Agent service
/var/ossec/bin/wazuh-control start

# Start the vulnerable Flask application
python /app/app.py