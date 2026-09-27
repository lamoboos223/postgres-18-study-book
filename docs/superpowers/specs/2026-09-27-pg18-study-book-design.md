# PostgreSQL 18 Essentials Study Book — Design

Date: 2026-09-27  
Exam: EDB Essentials for PostgreSQL v18 (community PostgreSQL, not EPAS)  
Format: Static multi-page HTML textbook

## Locked decisions

- Official EDB 15-topic spine; front matter + appendices only
- Hybrid visuals: SVG for exact labels; generated cartoons for mental models
- Labs: existing Debian VMs matching `pg-primary` 192.168.56.10 and `pg-standby` 192.168.56.11
- Database `study_lab`; roles `postgres`, `lab_admin`, `app_user`, `replicator`
- Schemas `app`, `ops`, `audit` after Chapter 8
- PGDG PostgreSQL 18 on Debian; first install in Chapter 3
- Build chapter-by-chapter; do not dump the whole book in one pass

## Chapter files

- `index.html` — home / TOC
- `chapters/00-front-matter.html`
- `chapters/01` … `15` matching the EDB outline
- Appendices after Chapter 15

## Accuracy

Prefer official PostgreSQL 18 docs. Mark version-specific behavior. Do not invent internals.
