FROM python:3.12-slim

# Set UTF-8 locale and environment variables for proper Arabic text handling
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    PYTHONIOENCODING=utf-8

WORKDIR /app

# Install build dependencies, Arabic fonts, locale support, and supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    supervisor \
    locales \
    fonts-dejavu \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    fonts-liberation \
    fonts-noto \
    fonts-noto-core \
    fontconfig \
    && echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
    && echo "ar_EG.UTF-8 UTF-8" >> /etc/locale.gen \
    && locale-gen \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt
COPY . .
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
