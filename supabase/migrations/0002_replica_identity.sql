-- DELETE 이벤트가 realtime 필터를 통과하도록 REPLICA IDENTITY를 FULL로 올린다.
--
-- 기본값(DEFAULT)에서는 DELETE의 old 레코드에 기본키 컬럼만 실린다. 그런데 클라이언트는
-- `filter: room_id=eq.<방id>` 로 구독하고 있어서, 기본키가 room_id를 포함하지 않는
-- 테이블은 서버가 필터를 평가할 수 없어 DELETE 이벤트를 통째로 버린다.
-- 그 결과 "팀원이 선택을 취소했는데 내 화면에서는 안 사라지는" 증상이 생긴다.
--
-- hero_selections(pk: id), room_members(pk: id) 가 여기 해당한다.
-- team_submissions는 기본키가 (room_id, team)이라 이미 필터가 통과하므로 그대로 둔다.

alter table hero_selections replica identity full;
alter table room_members replica identity full;
