-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS words_id_seq;

-- Table Definition
CREATE TABLE IF NOT EXISTS "public"."words" (
    "id" int4 NOT NULL DEFAULT nextval('words_id_seq'::regclass),
    "value" text NOT NULL,
    PRIMARY KEY ("id")
);