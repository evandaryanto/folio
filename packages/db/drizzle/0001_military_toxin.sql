CREATE TYPE "public"."view_type" AS ENUM('table', 'chart');--> statement-breakpoint
CREATE TABLE "views" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(26) NOT NULL,
	"composition_id" varchar(26) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"view_type" "view_type" NOT NULL,
	"config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(26)
);
--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_composition_id_compositions_id_fk" FOREIGN KEY ("composition_id") REFERENCES "public"."compositions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "views_workspace_slug_idx" ON "views" USING btree ("workspace_id","slug");--> statement-breakpoint
CREATE INDEX "views_workspace_id_idx" ON "views" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "views_composition_id_idx" ON "views" USING btree ("composition_id");