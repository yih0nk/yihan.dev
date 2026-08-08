/**
 * A schema.org block. `dangerouslySetInnerHTML` because React escapes children
 * into HTML entities, which would not be parseable JSON.
 *
 * `<` is escaped to <: JSON.stringify does not escape it, so a payload
 * containing `</script>` would close the tag early and the rest would parse as
 * markup. Every JSON parser reads < back as `<`.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
