CREATE TYPE "public"."payment_status" AS ENUM('created', 'pending', 'paid', 'failed', 'expired');--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"amount_minor" bigint NOT NULL,
	"asset_code" text NOT NULL,
	"asset_scale" integer NOT NULL,
	"description" text NOT NULL,
	"payee_name" text NOT NULL,
	"client_name" text,
	"client_country" text,
	"payer_wallet_address" text,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"provider" text NOT NULL,
	"received_minor" bigint DEFAULT 0 NOT NULL,
	"incoming_payment_url" text,
	"quote_id" text,
	"outgoing_payment_id" text,
	"grant_continue_uri" text,
	"grant_continue_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_request_id_payment_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."payment_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_events_request_id_idx" ON "payment_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "payment_requests_status_idx" ON "payment_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_requests_created_at_idx" ON "payment_requests" USING btree ("created_at");