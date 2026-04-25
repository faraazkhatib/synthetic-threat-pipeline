FROM python:3.11-slim

# -------------------------------------------------------------------
# Install system dependencies Cowrie NEEDS to run correctly
# -------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    git \
    libssl-dev libffi-dev \
    libxml2-dev libxslt1-dev \
    libjpeg-dev zlib1g-dev \
    net-tools iproute2 procps \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create cowrie user
RUN useradd -m -s /bin/bash cowrie

WORKDIR /home/cowrie

# -------------------------------------------------------------------
# Clone Cowrie fresh from GitHub
# -------------------------------------------------------------------
RUN git clone https://github.com/cowrie/cowrie.git

WORKDIR /home/cowrie/cowrie

# -------------------------------------------------------------------
# Create virtual environment and install Cowrie properly
# -------------------------------------------------------------------
RUN python3 -m venv cowrie-env \
    && /bin/bash -lc "source cowrie-env/bin/activate \
    && pip install --upgrade pip setuptools wheel \
    && pip install -r requirements.txt \
    && pip install -e ."

# Make sure logs & runtime dirs exist
RUN mkdir -p /var/log/cowrie var/run && chown -R cowrie:cowrie /var/log/cowrie var/run /home/cowrie

USER cowrie
WORKDIR /home/cowrie/cowrie

# -------------------------------------------------------------------
# RUN COWRIE IN FOREGROUND (the correct Docker way)
# -------------------------------------------------------------------
CMD ["./cowrie-env/bin/twistd", "-n", "--pidfile=var/run/cowrie.pid", "--logger=cowrie.python.logfile.logger", "cowrie"]

EXPOSE 2222
