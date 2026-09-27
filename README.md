# PostgreSQL 18 Certification Study Book

Visual HTML textbook for **EDB Essentials for PostgreSQL v18**.

Diagrams are colorful labeled boxes — not character illustrations.

## Open the book

Open `index.html`, or:

```powershell
python -m http.server 8765
```

Then visit http://127.0.0.1:8765/

## Lab VMs

| Host | IP | Role |
| --- | --- | --- |
| `pg-primary` | `192.168.56.10` | PostgreSQL 18 primary (install in Chapter 3) |
| `pg-standby` | `192.168.56.11` | Unused until Chapter 15 |

Database `study_lab`. Roles `postgres`, `lab_admin`, `app_user`, `replicator`.

## Chapters

00 Front matter through 15 Replication, plus cheat sheets and a mock exam.
