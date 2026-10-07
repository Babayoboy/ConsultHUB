create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.profiles;
  profile_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Member'
  )
  into profile_name
  from auth.users as u
  where u.id = current_user_id;

  if profile_name is null then
    raise exception 'The authenticated user record could not be found';
  end if;

  insert into public.profiles (id, display_name)
  values (
    current_user_id,
    case
      when char_length(profile_name) >= 2 then left(profile_name, 80)
      else 'Member'
    end
  )
  on conflict (id) do nothing;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if not found then
    raise exception 'The profile could not be created';
  end if;

  return current_profile;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;

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
