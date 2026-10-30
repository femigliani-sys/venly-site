-- =============================================================================
-- VENLY ESPORTS — schema do banco de dados (PostgreSQL / Supabase)
-- =============================================================================
-- Como aplicar:
--   1) Supabase → SQL Editor → cole este arquivo → Run
--   2) ou, do seu computador:  npm run db:migrate
--
-- O script é idempotente (IF NOT EXISTS / ON CONFLICT), pode rodar mais de uma vez.
-- Os dados demonstrativos (mapas, produtos, textos, admin) são criados
-- automaticamente pelo site no primeiro acesso, depois que as tabelas existem.
-- =============================================================================

-- ----------------------------- administração --------------------------------
create table if not exists admins (
  id            serial primary key,
  email         text not null unique,
  password_hash text not null,
  created_at    text not null
);
create unique index if not exists admins_email_lower_idx on admins (lower(email));

create table if not exists sessions (
  id         serial primary key,
  token_hash text not null unique,
  admin_id   integer not null references admins(id) on delete cascade,
  expires_at text not null,
  created_at text not null
);
create index if not exists idx_sessions_expiry on sessions (expires_at);

-- ------------------------------- conteúdo -----------------------------------
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at text not null
);

create table if not exists categories (
  id         serial primary key,
  type       text not null,
  name       text not null,
  slug       text not null,
  sort_order integer not null default 0,
  unique (type, slug)
);

-- ------------------------------ Venly Creates -------------------------------
create table if not exists maps (
  id          serial primary key,
  slug        text not null unique,
  title       text not null,
  category    text not null,
  summary     text not null default '',
  description text not null default '',
  status      text not null default 'Projeto conceitual',
  cover       text not null default '',
  gallery     text not null default '[]',
  video_url   text not null default '',
  featured    integer not null default 0,
  is_demo     integer not null default 0,
  sort_order  integer not null default 0,
  created_at  text not null,
  updated_at  text not null
);
create index if not exists idx_maps_category on maps (category);

create table if not exists map_requests (
  id           serial primary key,
  name         text not null,
  email        text not null,
  contact      text not null default '',
  map_type     text not null,
  project_name text not null,
  description  text not null,
  refs         text not null default '',
  budget       text not null default '',
  deadline     text not null default '',
  attachments  text not null default '[]',
  status       text not null default 'Nova',
  notes        text not null default '',
  created_at   text not null
);

-- ---------------------------------- loja ------------------------------------
create table if not exists products (
  id          serial primary key,
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  price_cents integer not null default 0,
  category    text not null,
  images      text not null default '[]',
  sizes       text not null default '[]',
  stock       integer not null default 0,
  active      integer not null default 1,
  featured    integer not null default 0,
  is_demo     integer not null default 0,
  sort_order  integer not null default 0,
  created_at  text not null,
  updated_at  text not null
);
create index if not exists idx_products_category on products (category);

create table if not exists orders (
  id               serial primary key,
  code             text not null unique,
  customer         text not null,
  items            text not null,
  subtotal_cents   integer not null,
  shipping_cents   integer not null default 0,
  total_cents      integer not null,
  status           text not null default 'Aguardando pagamento',
  payment_status   text not null default 'not_started',
  payment_provider text not null default '',
  payment_ref      text not null default '',
  created_at       text not null,
  updated_at       text not null
);

-- --------------------------------- equipe -----------------------------------
create table if not exists members (
  id         serial primary key,
  name       text not null,
  nickname   text not null default '',
  role       text not null,
  game       text not null default '',
  bio        text not null default '',
  photo      text not null default '',
  category   text not null,
  socials    text not null default '[]',
  sort_order integer not null default 0,
  created_at text not null
);

-- ------------------------------ contato e LGPD ------------------------------
create table if not exists contacts (
  id         serial primary key,
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  status     text not null default 'Nova',
  created_at text not null
);

create table if not exists consent_logs (
  id         serial primary key,
  token      text not null,
  version    text not null,
  necessary  integer not null default 1,
  analytics  integer not null default 0,
  ads        integer not null default 0,
  action     text not null,
  created_at text not null
);
create index if not exists idx_consent_created on consent_logs (created_at);

create table if not exists rate_limits (
  key          text primary key,
  count        integer not null,
  window_start bigint not null
);

-- ------------------------------- segurança ----------------------------------
-- RLS habilitado em todas as tabelas: a chave anônima (anon) do Supabase NÃO
-- consegue ler nem escrever nada. Todo acesso é feito no servidor com a
-- connection string do Postgres (DATABASE_URL). Se um dia você acessar o banco
-- pelo cliente JS, crie políticas específicas.
alter table admins       enable row level security;
alter table sessions     enable row level security;
alter table settings     enable row level security;
alter table categories   enable row level security;
alter table maps         enable row level security;
alter table map_requests enable row level security;
alter table products     enable row level security;
alter table orders       enable row level security;
alter table members      enable row level security;
alter table contacts     enable row level security;
alter table consent_logs enable row level security;
alter table rate_limits  enable row level security;
