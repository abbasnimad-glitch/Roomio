-- ============================================================
-- ROOMIO — NOTIFICATION SYSTEM PATCH
-- Run this in the Supabase SQL editor after schema.sql
-- (and after favorites_realtime_patch.sql, if applied).
--
-- schema.sql created the notifications table with RLS but nothing
-- ever wrote to it. This patch adds triggers that generate
-- notifications automatically for four events, and enables Realtime
-- so the frontend receives them live via postgres_changes:
--
--   - New Message           -> notify the message recipient
--   - Property Updated      -> notify the OWNER when admin changes
--                              their listing's status (approve/reject)
--   - Availability Changed  -> notify everyone who FAVORITED the
--                              property when its availability changes
--   - Favorite Update       -> notify everyone who FAVORITED the
--                              property when its core details change
--                              (name, price, description, amenities...)
--
-- All trigger functions are security definer, since they need to
-- insert a notification row for a user other than auth.uid() (the
-- recipient/owner/favoriter), which the "notifications_self" RLS
-- policy would otherwise block.
-- ============================================================

-- ------------------------------------------------------------
-- New Message
-- ------------------------------------------------------------
create or replace function public.notify_message_recipient()
returns trigger as $$
begin
  insert into notifications (user_id, title, body, link)
  values (
    new.recipient_id,
    'ข้อความใหม่',
    left(new.body, 140),
    '/profile'
  );
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists messages_notify_recipient_trg on messages;
create trigger messages_notify_recipient_trg
  after insert on messages
  for each row execute procedure public.notify_message_recipient();

-- ------------------------------------------------------------
-- Property Updated / Favorite Update / Availability Changed
-- (one combined trigger on properties; each branch is independent
-- and only fires for the specific columns that actually changed —
-- a plain view_count bump from increment_property_view matches none
-- of them, so it never generates noise notifications)
-- ------------------------------------------------------------
create or replace function public.properties_notify_after_update()
returns trigger as $$
begin
  -- Property Updated: admin approved/rejected/archived the listing -> notify the owner
  if old.status is distinct from new.status then
    insert into notifications (user_id, title, body, link)
    values (
      new.owner_id,
      'สถานะประกาศเปลี่ยนแปลง',
      new.name || ' ' || case new.status
        when 'approved' then 'ได้รับการอนุมัติแล้ว'
        when 'rejected' then 'ถูกปฏิเสธ'
        when 'archived' then 'ถูกเก็บเข้าคลัง'
        else 'มีการเปลี่ยนสถานะ'
      end,
      '/dashboard/owner/' || new.id || '/edit'
    );
  end if;

  -- Availability Changed: notify everyone who favorited this property
  if old.availability is distinct from new.availability then
    insert into notifications (user_id, title, body, link)
    select f.user_id,
           'สถานะห้องว่างเปลี่ยนแปลง',
           new.name || ' ' || case new.availability
             when 'available' then 'มีห้องว่างแล้ว'
             when 'almost_full' then 'ห้องใกล้เต็มแล้ว'
             when 'full' then 'ห้องเต็มแล้ว'
             else 'มีการเปลี่ยนสถานะห้องว่าง'
           end,
           '/property/' || new.slug
    from favorites f
    where f.property_id = new.id;
  end if;

  -- Favorite Update: core listing details changed -> notify everyone who favorited it
  if (old.name, old.description, old.price_monthly, old.room_type, old.gender_policy, old.address,
      old.has_air_conditioner, old.has_furniture, old.has_parking, old.has_wifi, old.has_security, old.has_laundry)
     is distinct from
     (new.name, new.description, new.price_monthly, new.room_type, new.gender_policy, new.address,
      new.has_air_conditioner, new.has_furniture, new.has_parking, new.has_wifi, new.has_security, new.has_laundry)
  then
    insert into notifications (user_id, title, body, link)
    select f.user_id,
           'รายการโปรดมีการอัปเดต',
           new.name || ' มีการอัปเดตรายละเอียด',
           '/property/' || new.slug
    from favorites f
    where f.property_id = new.id;
  end if;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists properties_notify_after_update_trg on properties;
create trigger properties_notify_after_update_trg
  after update on properties
  for each row execute procedure public.properties_notify_after_update();

-- ------------------------------------------------------------
-- Enable Realtime on notifications
-- (existing RLS still governs delivery: a client only ever receives
-- events for rows matching notifications_self, i.e. their own)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
