alter table "public"."mission_progression" add column "answer" text;

CREATE UNIQUE INDEX mission_progression_team_mission_idx ON public.mission_progression USING btree (team_id, mission_id);


