ALTER TABLE "backups" DROP COLUMN "enable";--> statement-breakpoint
ALTER TABLE "backups" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "emojis" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "stickers" jsonb DEFAULT '[]'::jsonb NOT NULL;
