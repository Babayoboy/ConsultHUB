alter table public.profiles
  add column if not exists avatar jsonb;

insert into public.profiles (id, display_name)
select
  u.id,
  case
    when char_length(name) >= 2 then left(name, 80)
    else 'Member'
  end
from (
  select
    id,
    coalesce(
      nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(email, ''), '@', 1), ''),
      'Member'
    ) as name
  from auth.users
) as u
on conflict (id) do nothing;
