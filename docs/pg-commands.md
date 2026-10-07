## Useful commands to maintain Postgres cluster

1- chnage vm hostname to the proper postgres deployment
`hostnamectl set-hostname pg-primary`

2- add the hostname to hosts file
```sh
echo '192.168.56.10 pg-primary
192.168.56.11 pg-standby' | sudo tee -a /etc/hosts
```

3- Install postgres server and creates database cluster (instance) automatically

```sh
sudo apt update
sudo apt install -y postgresql-common ca-certificates
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
sudo apt update
sudo apt install -y postgresql-18
pg_isready
pg_lsclusters
```

4- create OS user `postgres` and grant sudo (cluster admin)

```sh
sudo apt install -y sudo
sudo adduser --disabled-password --gecos "" postgres
echo 'postgres:postgres' | sudo chpasswd
sudo usermod -aG sudo postgres
su - postgres
```

5- Debian cluster paths (18 / `main`)

| Name          | Path                                  | Purpose                                                |
|------         |------                                 |---------                                               |
| Data dir      | `/var/lib/postgresql/18/main`         | Cluster data files (tables, WAL catalogs)              |
| Base dir      | `/var/lib/postgresql/18/main/base`    | Per-database table/index files                         |
| Global dir    | `/var/lib/postgresql/18/main/global`  | Cluster-wide data (roles, `pg_database`, `pg_control`) |
| Conf dir      | `/etc/postgresql/18/main`             | `postgresql.conf`, `pg_hba.conf` (Debian)              |
| Log dir       | `/var/log/postgresql`                 | Capture the logs from postgres clusters                |

6- Postgres Server installation crates a cluster by default named `main` let's create another cluster

```sh
sudo pg_createcluster 18 lab2 --port 5433
sudo pg_ctlcluster 18 lab2 stop
pg_lsclusters
sudo pg_dropcluster 18 lab2
```

7- Create a group and a user in postgres is the same, the only diff is not allowing the group to have a password then it will be treated as role where everybody can inhirt from.

```sql
CREATE ROLE admins_group NOLOGIN CREATEDB CREATEROLE;
CREATE ROLE alice LOGIN PASSWORD 'alice';
GRANT admins_group TO alice;
```

8- Grant permission on certain tables/schemas/databases

```sql
Grant connect on database School to alice; -- could be admins_group
Grant usage on schema Teachers to alice; -- granting to tables without schema won't allow the user to query the table
grant select, update, insert on All Tables in schema Teachers to alice;
GRANT SELECT, INSERT, UPDATE ON teachers.classes TO alice; -- granting access to custom tables
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA Teachers TO alice;
GRANT USAGE, SELECT ON SEQUENCE Teachers.users_id_seq TO alice; -- granting access to custom sequence
```

9- Monitor Postgres Logs

`sudo journalctl -f -u postgresql@18-main --no-pager`

10- This lists the processes connected to postgres engine
`SELECT pid, backend_type FROM pg_stat_activity ORDER BY 2`

Example output:
 pid  |         backend_type
------+------------------------------
 3432 | autovacuum launcher
 3429 | background writer
 3515 | client backend `psql`
 3428 | checkpointer
 3425 | io worker
 3426 | io worker
 3427 | io worker
 3433 | logical replication launcher
 3431 | walwriter
(9 rows)

and with each client app connection it will fork a new `client backend`.

11- Check the live session on postgres and which db they are connected to

`SELECT pid, usename, datname, state, query FROM pg_stat_activity`

12- List the db and their oid. The oid is useful to know the db file in the dir `base`. And that is useful when the base folder is taking so much space but you don't know which db is causing the bloat.
`SELECT oid, datname FROM pg_database ORDER BY 1;`


13- List the blocked queries from a lock
`SELECT * FROM pg_locks WHERE NOT granted;`

14- List the blocker queries
`SELECT * FROM pg_locks WHERE granted;`

15- Find the execution plan of a query
`EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM table WHERE key = value;`

16- Invistigate the tables plans and last time it had stats updated
```sql
SELECT relname, last_analyze, last_autoanalyze, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE relname = 'table_name';
```

17- Taking incremental backups then combine them together

```sh
sudo -u postgres psql -c "SHOW summarize_wal;" # should be on
sudo -u postgres pg_basebackup -D /var/lib/postgresql/backups/full -Fp -Xs -P # This will generate backup_manifest 
# Generate incremental backup
sudo -u postgres pg_basebackup \
  -D /var/lib/postgresql/backups/incr1 \
  --incremental=/var/lib/postgresql/backups/full/backup_manifest \
  -Fp -Xs -P

# combine
sudo -u postgres pg_combinebackup \
  /var/lib/postgresql/backups/full \
  /var/lib/postgresql/backups/incr1 \
  -o /var/lib/postgresql/backups/combined
```

18- `pg_stat_user_tables.n_dead_tup` is the count of leftover row versions after UPDATE/DELETE. `n_live_tup` is the live rows. VACUUM marks the dead space reusable; it does not always shrink the file. vacuum_all shrinks the file, also pg_repack;

```sql
SELECT relname, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE relname = 'table_name';
```

19- Pipeline command

> it is like async request where second query doesn't wait for first query to end

```sql
\startpipeline
insert into sensors(id, reading) values (1, 24.2);
insert into sensors(id, reading) values (2, 29.2);
\endpipeline
```

20- Row Level Security (RLS) policies. GRANT is table-wide; a policy filters rows. Enable RLS first — with no policy a non-owner sees zero rows. `USING` filters existing rows (SELECT/UPDATE/DELETE). `WITH CHECK` guards new/updated rows (INSERT/UPDATE). Table owner and superuser bypass unless `FORCE ROW LEVEL SECURITY`. Test as the app role, not as `postgres`.

```sql
ALTER TABLE app.notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app.notes FORCE ROW LEVEL SECURITY;

CREATE POLICY notes_own ON app.notes
  FOR ALL
  TO app_user
  USING (owner = current_user)
  WITH CHECK (owner = current_user);

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'notes';

-- DROP POLICY notes_own ON app.notes;
```

21- Database encryption in community Postgres is column-level via `pgcrypto`, not TDE. Encrypting every column is slow and does not replace GRANT / RLS / disk encryption. One-way (`crypt`) for passwords — you cannot decrypt. Two-way (`pgp_sym_encrypt`) for values you must read back. The passphrase is the secret; anyone with SELECT and the key can decrypt.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- one-way
SELECT crypt('lab_only', gen_salt('bf'));
SELECT crypt('lab_only', pw_hash) = pw_hash AS pw_ok FROM app.secrets;

-- two-way
SELECT pgp_sym_encrypt('4111111111111111', 'study_lab_key');
SELECT pgp_sym_decrypt(card, 'study_lab_key') FROM app.secrets;
```


22- Copy data either via `\copy` command inside psql client or via `pg_dump` postgres utility.
```sql
CREATE TABLE app.products_stage (LIKE app.products INCLUDING ALL);
\copy app.products TO '/tmp/products.csv' WITH (FORMAT csv, HEADER true)
\copy app.products_stage FROM '/tmp/products.csv' WITH (FORMAT csv, HEADER true)
SELECT count(*) FROM app.products_stage;

sudo -u postgres pg_dump -d study_lab -a -t app.users -f /tmp/users_data.sql
# -a data-only, -t table
```

23- HA, Create physical replication stream between primary and standby

first create postgres cluster on standby, then:

```sql
CREATE ROLE replicator LOGIN REPLICATION PASSWORD 'replicator';
-- REPLICATION is a role attribute. The slot name is what the standby will use as primary_slot_name.
SELECT pg_create_physical_replication_slot('standby1');
```
in `pg_primary` add the below to `pg_hpa.conf`.
`host    replication    replicator    192.168.56.11/32    scram-sha-256`

**On pg-standby** do this:
```sh
sudo pg_ctlcluster 18 main stop
sudo rm -rf /var/lib/postgresql/18/main/*
sudo -u postgres pg_basebackup   -h <ip-of-pg_primary> -U replicator -D /var/lib/postgresql/18/main   -Fp -Xs -P -R --slot=standby1
# password is replicator
sudo pg_ctlcluster 18 main start
```

24- HA, promote standby as writer

first stop the `pg_primary`

```sh
systemctl stop postgresql
```

on `pg_standby`
```sql
SELECT pg_promote();
SELECT pg_is_in_recovery();
```

now you can write into the standby.


25- HA, Create Logical replication

on **pg-primary**

```sql
SHOW wal_level;
ALTER SYSTEM SET wal_level = 'logical';
```

```sql
CREATE ROLE replicator LOGIN REPLICATION PASSWORD 'replicator';
GRANT USAGE ON SCHEMA app TO replicator;
GRANT SELECT ON app.users TO replicator;
CREATE PUBLICATION study_pub FOR TABLE app.users;
```
on **pg_hba.conf**
```ini
host    study_lab    replicator    <ip-of-pg-standby>/32    scram-sha-256
```

`sudo pg_ctlcluster 18 main restart`

on **pg-standby** 
check if it is not on recovery mode `SELECT pg_is_in_recovery();` it should show `f`.

```sql
CREATE DATABASE study_lab;
\c study_lab
CREATE SCHEMA app;
CREATE TABLE app.users (
  id         bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SUBSCRIPTION study_sub
  CONNECTION 'host=<ip-of-pg-primary> port=5432 dbname=study_lab user=replicator password=replicator'
  PUBLICATION study_pub;
```

create the same `app_user` from primary
```sql
CREATE ROLE app_user LOGIN PASSWORD 'app_user';
GRANT CONNECT ON DATABASE study_lab TO app_user;
GRANT USAGE ON SCHEMA app TO app_user;
GRANT SELECT ON app.users TO app_user;
```
**on-primary**
```sql
SELECT slot_name, slot_type, active FROM pg_replication_slots;
SELECT application_name, state FROM pg_stat_replication;
```
on **pg-standby** 
```sql
SELECT srrelid::regclass, srsubstate FROM pg_subscription_rel;
SELECT count(*) FROM app.users;
```