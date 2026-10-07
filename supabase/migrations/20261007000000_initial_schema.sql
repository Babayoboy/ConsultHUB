create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  account_type text not null default 'learner' check (account_type in ('learner', 'expert')),
  headline text not null default '' check (char_length(headline) <= 160),
  avatar jsonb,
  created_at timestamptz not null default now()
);

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    case
      when char_length(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))) >= 2
        then left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 80)
      else 'Member'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create function public.prevent_self_role_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.account_type is distinct from old.account_type
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only a trusted administrator can change account type';
  end if;
  return new;
end;
$$;

create trigger protect_profile_account_type
  before update of account_type on public.profiles
  for each row execute function public.prevent_self_role_escalation();

create table public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{"saved":[],"sessions":[],"threads":[]}'::jsonb
    check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);

create function public.set_app_state_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_state_updated_at
  before update on public.app_state
  for each row execute function public.set_app_state_updated_at();

create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique
);

create table public.expert_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bio text not null default '',
  rate_paise integer not null check (rate_paise >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.expert_categories (
  expert_id uuid not null references public.expert_profiles (user_id) on delete cascade,
  category_slug text not null references public.categories (slug) on delete cascade,
  primary key (expert_id, category_slug)
);

create table public.saved_experts (
  learner_id uuid not null references public.profiles (id) on delete cascade,
  expert_id uuid not null references public.expert_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (learner_id, expert_id),
  check (learner_id <> expert_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  expert_id uuid not null references public.expert_profiles (user_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 15 and 240),
  amount_paise integer not null check (amount_paise >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (learner_id <> expert_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  provider text not null,
  provider_payment_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  session_id uuid references public.sessions (id) on delete set null,
  transaction_type text not null check (transaction_type in ('purchase', 'booking', 'refund', 'adjustment')),
  amount_paise integer not null check (amount_paise <> 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  check (payment_id is null or session_id is null)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  expert_id uuid not null references public.expert_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (learner_id, expert_id),
  check (learner_id <> expert_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create index sessions_learner_starts_at_idx on public.sessions (learner_id, starts_at);
create index sessions_expert_starts_at_idx on public.sessions (expert_id, starts_at);
create index credit_transactions_user_created_at_idx on public.credit_transactions (user_id, created_at desc);
create index messages_conversation_created_at_idx on public.messages (conversation_id, created_at);

alter table public.profiles enable row level security;
alter table public.app_state enable row level security;
alter table public.categories enable row level security;
alter table public.expert_profiles enable row level security;
alter table public.expert_categories enable row level security;
alter table public.saved_experts enable row level security;
alter table public.sessions enable row level security;
alter table public.payments enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Users can access their own app state"
  on public.app_state for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can create their own app state"
  on public.app_state for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can update their own app state"
  on public.app_state for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Categories are readable"
  on public.categories for select to anon, authenticated using (true);
create policy "Published experts and owners are readable"
  on public.expert_profiles for select to anon, authenticated
  using (is_published or user_id = (select auth.uid()));
create policy "Categories of published experts are readable"
  on public.expert_categories for select to anon, authenticated
  using (exists (
    select 1 from public.expert_profiles e
    where e.user_id = expert_id and (e.is_published or e.user_id = (select auth.uid()))
  ));

create policy "Learners manage their saved experts"
  on public.saved_experts for all to authenticated
  using (learner_id = (select auth.uid()))
  with check (learner_id = (select auth.uid()));

create policy "Participants can read sessions"
  on public.sessions for select to authenticated
  using (learner_id = (select auth.uid()) or expert_id = (select auth.uid()));
create policy "Users can read their own payments"
  on public.payments for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can read their own credit transactions"
  on public.credit_transactions for select to authenticated using (user_id = (select auth.uid()));
create policy "Conversation participants can read conversations"
  on public.conversations for select to authenticated
  using (learner_id = (select auth.uid()) or expert_id = (select auth.uid()));
create policy "Conversation participants can read messages"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.learner_id = (select auth.uid()) or c.expert_id = (select auth.uid()))
  ));

revoke all on public.profiles, public.app_state, public.categories, public.expert_profiles,
  public.expert_categories, public.saved_experts, public.sessions, public.payments,
  public.credit_transactions, public.conversations, public.messages from anon, authenticated;

grant select on public.categories, public.expert_profiles, public.expert_categories to anon, authenticated;
grant select on public.profiles, public.app_state, public.saved_experts, public.sessions,
  public.payments, public.credit_transactions, public.conversations, public.messages to authenticated;
grant update (display_name, headline, avatar) on public.profiles to authenticated;
grant insert, update, delete on public.saved_experts to authenticated;
grant insert, select, update on public.app_state to authenticated;
