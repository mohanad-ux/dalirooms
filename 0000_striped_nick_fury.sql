CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lang" text NOT NULL,
	"translation_key" text NOT NULL,
	"translation_value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
