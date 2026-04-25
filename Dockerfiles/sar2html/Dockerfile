FROM php:7.4-apache

# LABEL maintainer="Your Name <your.email@example.com>"
LABEL description="Docker image for sar2html web application (Vulnerable to RCE) CVE-2025-34030"

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies if sar2html requires any specific PHP extensions or system libs
# RUN docker-php-ext-install pdo_mysql # Example if it needed MySQL

# Copy the sar2html web application files into the default Apache web root
COPY sar2html/ /var/www/html/sar2html/

# Set appropriate permissions for the web content
RUN chown -R www-data:www-data /var/www/html/sar2html/ \
    && find /var/www/html/sar2html/ -type d -exec chmod 755 {} \; \
    && find /var/www/html/sar2html/ -type f -exec chmod 644 {} \;

# Enable necessary Apache modules if not already enabled by the base image
# RUN a2enmod rewrite

# Configure Apache (optional: if you need custom logging or virtual hosts)
# COPY apache-vhost.conf /etc/apache2/sites-available/sar2html.conf
# RUN a2ensite sar2html.conf

# Expose the web server port
EXPOSE 80

# Apache is usually started by the base image's CMD/ENTRYPOINT
# CMD ["apache2-foreground"] # This is usually handled by the base image