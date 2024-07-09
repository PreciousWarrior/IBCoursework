#!/bin/bash

PORT="XXXX"
DBNAME="XXXX"
TIMESTAMP=$(date '+%Y%m%d%H%M%S')
mkdir -p "backup/$TIMESTAMP"
BACKUP_SCRIPT_PATH="/usr/bin/mongodump --host 127.0.0.1 --port $PORT --db $DBNAME --out backup/$TIMESTAMP"
CRON_SCHEDULE="0 0 * * *"
(crontab -l ; echo "$CRON_SCHEDULE $BACKUP_SCRIPT_PATH") | sort - | uniq - | crontab -