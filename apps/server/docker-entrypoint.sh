#!/bin/sh
set -e

MMDB_PATH="/app/apps/server/GeoLite2-City.mmdb"

if [ ! -f "$MMDB_PATH" ]; then
  if [ -n "$MAXMIND_LICENSE_KEY" ]; then
    echo "Downloading GeoLite2-City.mmdb from MaxMind..."
    curl -sSL "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz" \
      -o /tmp/geolite2.tar.gz
    tar -xzf /tmp/geolite2.tar.gz -C /tmp
    find /tmp -name "GeoLite2-City.mmdb" -exec mv {} "$MMDB_PATH" \;
    rm -rf /tmp/geolite2.tar.gz /tmp/GeoLite2-City_*
    echo "mmdb ready at $MMDB_PATH"
  elif [ -n "$MMDB_DOWNLOAD_URL" ]; then
    echo "Downloading mmdb from custom URL..."
    curl -sSL "$MMDB_DOWNLOAD_URL" -o "$MMDB_PATH"
  else
    echo "WARNING: MAXMIND_LICENSE_KEY / MMDB_DOWNLOAD_URL not set — country lookups will return 'Unknown' until this is fixed."
  fi
fi

exec "$@"