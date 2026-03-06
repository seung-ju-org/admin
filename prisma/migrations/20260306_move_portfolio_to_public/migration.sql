DO $$
DECLARE
  table_name text;
BEGIN
  -- Move locale enums first so table type references remain valid.
  IF to_regtype('"public"."Locale"') IS NULL
     AND to_regtype('"portfolio"."Locale"') IS NOT NULL THEN
    EXECUTE 'ALTER TYPE "portfolio"."Locale" SET SCHEMA "public"';
  END IF;

  IF to_regtype('"public"."PortfolioLocale"') IS NULL
     AND to_regtype('"portfolio"."PortfolioLocale"') IS NOT NULL THEN
    EXECUTE 'ALTER TYPE "portfolio"."PortfolioLocale" SET SCHEMA "public"';
  END IF;

  -- Move portfolio domain tables to public schema.
  FOREACH table_name IN ARRAY ARRAY[
    'Project',
    'ProjectTranslation',
    'Technology',
    'ProjectTechnology',
    'Career',
    'CareerTranslation'
  ]
  LOOP
    IF to_regclass(format('"portfolio"."%s"', table_name)) IS NOT NULL
       AND to_regclass(format('"public"."%s"', table_name)) IS NULL THEN
      EXECUTE format('ALTER TABLE "portfolio"."%s" SET SCHEMA "public"', table_name);
    END IF;
  END LOOP;
END
$$;
