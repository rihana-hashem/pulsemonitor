#!/usr/bin/env bash
set -euo pipefail

initialize_database() {
    marker=/var/opt/mssql/.pulsemonitor-initialized
    if [[ -f "$marker" ]]; then
        return
    fi

    export SQLCMDPASSWORD="$MSSQL_SA_PASSWORD"
    sqlcmd=(/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -I -l 3)

    for attempt in {1..30}; do
        if "${sqlcmd[@]}" -d master -Q 'SELECT 1' >/dev/null 2>&1; then
            for script in /init/00[1-4]_*.sql; do
                echo "Applying $script"
                "${sqlcmd[@]}" -d master -i "$script" || return 1
            done
            touch "$marker"
            return
        fi
        sleep 2
    done

    echo "SQL Server did not become ready for schema initialization." >&2
    return 1
}

initialize_database &
exec /opt/mssql/bin/sqlservr
