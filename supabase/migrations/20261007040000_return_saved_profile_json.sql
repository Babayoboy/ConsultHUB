drop function if exists public.update_my_profile(text, text, jsonb);

create function public.update_my_profile(
  p_display_name text,
  p_headline text,
  p_avatar jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_profile public.profiles;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.profiles (id, display_name)
  select
    current_user_id,
    case
      when char_length(name) >= 2 then left(name, 80)
      else 'Member'
    end
  from (
    select coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'Member'
    ) as name
    from auth.users as u
    where u.id = current_user_id
  ) as auth_profile
  on conflict (id) do nothing;

  update public.profiles
  set
    display_name = p_display_name,
    headline = coalesce(p_headline, ''),
    avatar = p_avatar
  where id = current_user_id
  returning * into updated_profile;

  if not found then
    raise exception 'The authenticated user profile could not be created';
  end if;

  return jsonb_build_object(
    'display_name', updated_profile.display_name,
    'headline', updated_profile.headline,
    'avatar', updated_profile.avatar
  );
end;
$$;

revoke all on function public.update_my_profile(text, text, jsonb) from public, anon;
grant execute on function public.update_my_profile(text, text, jsonb) to authenticated;
