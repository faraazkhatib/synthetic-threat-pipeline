FROM ubuntu:latest

# LABEL maintainer="Your Name <your.email@example.com>"
LABEL description="Docker image for a FTP interraction honeypot"

ENV DEBIAN_FRONTEND=noninteractive

# Install VSFTPD and other utilities
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    vsftpd \
    net-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a directory for FTP data (e.g., a fake root)
RUN mkdir -p /var/ftp/pub

# Copy a custom vsftpd configuration file
# This custom config would contain your honeypot-specific settings
# COPY vsftpd.conf /etc/vsftpd.conf

# Copy fake files/directories if you have them
# COPY fake_ftp_root/ /var/ftp/pub/

# Add a user for FTP access (or configure vsftpd for anonymous access)
RUN useradd -m -s /sbin/nologin ftphoney
RUN echo "ftphoney:password" | chpasswd
RUN chown -R ftphoney:ftphoney /home/ftphoney
RUN chmod a-w /home/ftphoney

# Set permissions for the FTP root
RUN chown -R nobody:nogroup /var/ftp/pub

# Expose the FTP data port (21) and passive ports (if configured in vsftpd.conf)
EXPOSE 21
# EXPOSE 20 # For FTP data connections if using active mode
# If using passive mode, you'd expose a range defined in vsftpd.conf
# EXPOSE 40000-40005

# Command to run VSFTPD
# Use -o option to pass configuration directly or ensure vsftpd.conf is used
CMD ["/usr/sbin/vsftpd", "/etc/vsftpd.conf"]